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

export function createLocalRuntimeExecutive(config) {
  if (!config?.cmd || typeof config.cmd !== 'string' || !config.cmd.trim()) {
    const err = new Error(
      'local_runtime unavailable: DELTAX_LOCAL_RUNTIME_CMD is missing. Refusing silent stub fallback.',
    );
    err.code = 'LOCAL_RUNTIME_UNAVAILABLE';
    throw err;
  }

  const args = Array.isArray(config.args) ? config.args : [];
  const timeoutMs = config.timeoutMs ?? 10_000;
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
      const { resolve, reject, timer } = pending;
      pending = null;
      clearTimeout(timer);
      try {
        const raw = JSON.parse(line);
        const decision = makeDecisionPacket({
          ...raw,
          provenance: {
            ...(raw.provenance || {}),
            executive_source: EXECUTIVE_SOURCES.local_runtime,
            adapter: 'DeltaXLocalRuntime',
            genuine_deltax: raw?.provenance?.genuine_deltax === true,
          },
        });
        assertDisposition(decision.selected_disposition);
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
        pending = { resolve, reject, timer };
        try {
          child.stdin.write(JSON.stringify({ type: 'evaluate', packet }) + '\n');
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
