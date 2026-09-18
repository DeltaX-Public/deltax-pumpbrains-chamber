/**
 * Local runtime executive: JSONL stdin/stdout child process.
 * Fail loudly if unavailable — never silent stub fallback.
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import {
  assertCandidatesFirst,
  assertDisposition,
  makeDecisionPacket,
  EXECUTIVE_SOURCES,
} from '../schemas/packets.js';

function mapProviderDecision(raw, packet) {
  const disposition = assertDisposition(
    raw.selected_disposition || raw.disposition || 'DEFER',
  );
  const idOf = (entry) => {
    if (typeof entry === 'string') return entry;
    return entry?.substrate_candidate_id || entry?.candidate_id || entry?.id || null;
  };
  const permitted = (raw.permitted_candidates || raw.permitted || [])
    .map(idOf)
    .filter(Boolean);
  const vetoed = (raw.vetoed_candidates || raw.vetoed || [])
    .map(idOf)
    .filter(Boolean);
  const deferred = (raw.deferred_candidates || raw.unresolved || []).map((entry) => {
    if (typeof entry === 'string') return { candidate_id: entry, reason: 'unresolved' };
    return {
      candidate_id: idOf(entry),
      reason: entry.reason || 'unresolved',
    };
  }).filter((d) => d.candidate_id);

  let modulation_commands = raw.modulation_commands || [];
  if ((!modulation_commands || !modulation_commands.length) && raw.modulation && Object.keys(raw.modulation).length) {
    const hint = raw.modulation;
    modulation_commands = [{
      target: 'substrate',
      parameter: 'caution',
      previous_value: 0.5,
      new_value: 0.7,
      duration: 'step',
      decision_id: null,
      candidate_id: hint.selected_id || permitted[0] || null,
      hint: hint.hint || null,
    }];
  }

  const evaluated = (packet.candidate_actions || []).map((c) => {
    let d = 'PERMIT';
    let reason = 'local_runtime';
    if (vetoed.includes(c.candidate_id) || vetoed.includes(c.substrate_candidate_id)) {
      d = 'VETO';
      reason = 'local_runtime_veto';
    } else if (deferred.some((x) => x.candidate_id === c.candidate_id || x.candidate_id === c.substrate_candidate_id)) {
      d = disposition === 'DEFER' || disposition === 'ESCALATE' ? disposition : 'DEFER';
      reason = 'local_runtime_unresolved';
    } else if (disposition === 'MODULATE' && (permitted.includes(c.candidate_id) || permitted.includes(c.substrate_candidate_id))) {
      d = 'MODULATE';
      reason = 'local_runtime_modulate';
    } else if (!(permitted.includes(c.candidate_id) || permitted.includes(c.substrate_candidate_id))) {
      d = disposition;
      reason = 'local_runtime_not_selected';
    }
    return { candidate_id: c.candidate_id, disposition: d, reason };
  });

  return makeDecisionPacket({
    selected_disposition: disposition,
    evaluated_candidates: evaluated,
    permitted_candidates: permitted,
    vetoed_candidates: vetoed,
    deferred_candidates: deferred,
    modulation_commands,
    unresolved_contradictions: packet.detected_contradictions || [],
    constraint_refs: (packet.active_constraints || []).map((c) => (typeof c === 'string' ? { id: c } : c)),
    provenance: {
      ...(raw.provenance || {}),
      executive_source: EXECUTIVE_SOURCES.local_runtime,
      adapter: 'DeltaXLocalRuntime',
      genuine_deltax: true,
      provider_disposition: disposition,
    },
  });
}

export function createLocalRuntimeExecutive(config) {
  if (!config?.cmd || typeof config.cmd !== 'string' || !config.cmd.trim()) {
    const err = new Error(
      'local_runtime unavailable: DELTAX_LOCAL_RUNTIME_CMD is missing. Refusing silent stub fallback.',
    );
    err.code = 'LOCAL_RUNTIME_UNAVAILABLE';
    throw err;
  }

  const args = Array.isArray(config.args) ? config.args : [];
  const timeoutMs = config.timeoutMs ?? 15_000;
  let child = null;
  let rl = null;
  let pending = null;
  let closed = false;

  function ensureChild() {
    if (child && !child.killed) return;
    try {
      child = spawn(config.cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env } });
    } catch (e) {
      const err = new Error(
        `local_runtime unavailable: failed to spawn "${config.cmd}": ${e.message}. Refusing silent stub fallback.`,
      );
      err.code = 'LOCAL_RUNTIME_UNAVAILABLE';
      err.cause = e;
      throw err;
    }
    child.stderr?.on('data', (buf) => {
      // keep stderr available for debugging without breaking JSONL stdout
      if (process.env.DELTAX_LOCAL_RUNTIME_DEBUG) {
        process.stderr.write(`[local_runtime] ${buf}`);
      }
    });
    child.on('error', (e) => {
      if (pending) {
        pending.reject(Object.assign(
          new Error(`local_runtime unavailable: process error: ${e.message}. Refusing silent stub fallback.`),
          { code: 'LOCAL_RUNTIME_UNAVAILABLE', cause: e },
        ));
        pending = null;
      }
    });
    child.on('exit', (code, signal) => {
      if (pending) {
        pending.reject(Object.assign(
          new Error(`local_runtime exited (code=${code}, signal=${signal}). Refusing silent stub fallback.`),
          { code: 'LOCAL_RUNTIME_UNAVAILABLE' },
        ));
        pending = null;
      }
      child = null;
      rl = null;
    });
    rl = createInterface({ input: child.stdout });
    rl.on('line', (line) => {
      if (!pending) return;
      const { resolve, reject, timer, packet } = pending;
      pending = null;
      clearTimeout(timer);
      try {
        const raw = JSON.parse(line);
        const decision = mapProviderDecision(raw, packet);
        for (const cmd of decision.modulation_commands) cmd.decision_id = decision.decision_id;
        resolve(decision);
      } catch (e) {
        reject(Object.assign(new Error(`local_runtime returned invalid JSONL: ${e.message}`), {
          code: 'LOCAL_RUNTIME_BAD_RESPONSE', cause: e,
        }));
      }
    });
  }

  return {
    mode: 'local_runtime',
    executive_source: EXECUTIVE_SOURCES.local_runtime,
    genuine_deltax: true,
    async evaluate(packet) {
      if (closed) throw Object.assign(new Error('local_runtime executive is closed'), { code: 'LOCAL_RUNTIME_CLOSED' });
      assertCandidatesFirst(packet);
      ensureChild();
      if (!child?.stdin) {
        throw Object.assign(
          new Error('local_runtime unavailable: no stdin. Refusing silent stub fallback.'),
          { code: 'LOCAL_RUNTIME_UNAVAILABLE' },
        );
      }
      if (pending) throw new Error('local_runtime: overlapping evaluate calls not supported');
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending = null;
          reject(Object.assign(
            new Error(`local_runtime timed out after ${timeoutMs}ms. Refusing silent stub fallback.`),
            { code: 'LOCAL_RUNTIME_TIMEOUT' },
          ));
        }, timeoutMs);
        pending = { resolve, reject, timer, packet };
        try {
          child.stdin.write(JSON.stringify(packet) + '\n');
        } catch (e) {
          clearTimeout(timer);
          pending = null;
          reject(Object.assign(
            new Error(`local_runtime write failed: ${e.message}. Refusing silent stub fallback.`),
            { code: 'LOCAL_RUNTIME_UNAVAILABLE', cause: e },
          ));
        }
      });
    },
    async close() {
      closed = true;
      if (rl) rl.close();
      if (child && !child.killed) { child.stdin?.end(); child.kill('SIGTERM'); }
      child = null;
    },
  };
}
