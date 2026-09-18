/**
 * DeltaXStub / DeltaXReferenceAdapter
 * Explicitly NOT genuine DeltaX. Provenance.executive_source === 'deltax_stub'
 */

import {
  assertCandidatesFirst,
  assertDisposition,
  makeDecisionPacket,
  EXECUTIVE_SOURCES,
} from '../schemas/packets.js';

const STUB_RULES = {
  vetoClasses: ['escape', 'crack', 'unsafe', 'bypass'],
  modulateClasses: ['arousal', 'courtship', 'exploration'],
  deferClasses: ['unknown', 'ambiguous'],
};

function pushModulate(cmds, cand) {
  cmds.push({
    target: cand.source_population || 'substrate',
    parameter: 'caution',
    previous_value: 0.5,
    new_value: 0.7,
    duration: 'step',
    decision_id: null,
    candidate_id: cand.candidate_id,
  });
}

export async function evaluateStub(packet, opts = {}) {
  assertCandidatesFirst(packet);

  const constraints = packet.active_constraints || [];
  const vetoActive = constraints.some(
    (c) => c === 'invariant_veto' || c?.id === 'invariant_veto' || c?.type === 'invariant_veto',
  );
  const modulateHint = constraints.find(
    (c) => c === 'request_modulate' || c?.id === 'request_modulate' || c?.type === 'request_modulate',
  );

  const evaluated = [];
  const permitted = [];
  const vetoed = [];
  const deferred = [];
  const modulation_commands = [];
  let selected = opts.forceDisposition || null;

  for (const cand of packet.candidate_actions) {
    const cls = String(cand.action_class || '').toLowerCase();
    let disposition = 'PERMIT';
    let reason = 'stub_default_permit';

    if (opts.forceDisposition) {
      disposition = assertDisposition(opts.forceDisposition);
      reason = `stub_forced_${disposition.toLowerCase()}`;
      if (disposition === 'MODULATE') pushModulate(modulation_commands, cand);
    } else if (vetoActive && STUB_RULES.vetoClasses.some((v) => cls.includes(v))) {
      disposition = 'VETO';
      reason = 'stub_invariant_veto';
    } else if (STUB_RULES.deferClasses.some((v) => cls.includes(v))) {
      disposition = 'DEFER';
      reason = 'stub_ambiguous';
    } else if (modulateHint || STUB_RULES.modulateClasses.some((v) => cls.includes(v))) {
      disposition = 'MODULATE';
      reason = 'stub_modulate';
      pushModulate(modulation_commands, cand);
    }

    evaluated.push({ candidate_id: cand.candidate_id, disposition, reason });

    if (disposition === 'PERMIT') permitted.push(cand.candidate_id);
    else if (disposition === 'VETO') vetoed.push(cand.candidate_id);
    else if (disposition === 'DEFER') deferred.push({ candidate_id: cand.candidate_id, reason });
    else if (disposition === 'MODULATE') permitted.push(cand.candidate_id);
    else if (disposition === 'ESCALATE') deferred.push({ candidate_id: cand.candidate_id, reason: 'escalate' });

    if (!selected) selected = disposition;
  }

  for (const p of ['VETO', 'ESCALATE', 'DEFER', 'MODULATE', 'PERMIT']) {
    if (evaluated.some((e) => e.disposition === p)) { selected = p; break; }
  }

  const decision = makeDecisionPacket({
    selected_disposition: assertDisposition(selected || 'DEFER'),
    evaluated_candidates: evaluated,
    permitted_candidates: permitted,
    vetoed_candidates: vetoed,
    deferred_candidates: deferred,
    modulation_commands,
    unresolved_contradictions: packet.detected_contradictions || [],
    constraint_refs: constraints.map((c) => (typeof c === 'string' ? { id: c } : c)),
    provenance: {
      executive_source: EXECUTIVE_SOURCES.stub,
      adapter: 'DeltaXStub',
      genuine_deltax: false,
      note: 'Reference stub only — not canonical DeltaX output',
    },
  });

  for (const cmd of decision.modulation_commands) cmd.decision_id = decision.decision_id;
  return decision;
}

export function createStubExecutive() {
  return {
    mode: 'stub',
    executive_source: EXECUTIVE_SOURCES.stub,
    genuine_deltax: false,
    async evaluate(packet, opts) { return evaluateStub(packet, opts); },
    async close() {},
  };
}
