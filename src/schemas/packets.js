/**
 * Public packet shapes for the PumpBrains twin-chamber harness.
 * Mirrors docs/DELTAX_INTERFACE.md — no proprietary DeltaX math.
 */

export const DISPOSITIONS = Object.freeze([
  'PERMIT', 'VETO', 'MODULATE', 'DEFER', 'ESCALATE',
]);

export const EXECUTIVE_MODES = Object.freeze(['stub', 'local_runtime', 'disabled']);

export const CHAMBER_CONDITIONS = Object.freeze(['CONTROL', 'OBSERVE', 'EXECUTIVE']);

export const EXECUTIVE_SOURCES = Object.freeze({
  stub: 'deltax_stub',
  local_runtime: 'deltax_local_runtime',
  disabled: 'deltax_disabled',
});

/** Mosca (fly) channels from PumpBrains species manifest */
export const MOSCA_CHANNELS = Object.freeze([
  'sugar', 'bitter', 'salt', 'grooming', 'pheromone', 'taste_peg',
  'olfactory', 'auditory', 'wind', 'bristle', 'visual', 'ocellar',
]);

/** Mosca behaviors from PumpBrains species manifest */
export const MOSCA_BEHAVIORS = Object.freeze([
  'feeding', 'escape', 'walking', 'grooming', 'courtship', 'arousal',
]);

/**
 * Assert candidates exist before executive evaluation (causal chain).
 */
export function assertCandidatesFirst(packet) {
  if (!packet || typeof packet !== 'object') {
    throw new Error('EvaluationPacket required');
  }
  if (!Array.isArray(packet.candidate_actions) || packet.candidate_actions.length === 0) {
    throw new Error(
      'Causal chain violation: candidate_actions must exist before DeltaX evaluation',
    );
  }
  for (const c of packet.candidate_actions) {
    if (!c || !c.candidate_id) {
      throw new Error('Each candidate_action requires candidate_id');
    }
    const origin = c.origin || c.source || c.source_population;
    if (origin && typeof origin === 'string') {
      const lower = origin.toLowerCase();
      if (lower.includes('deltax') && !lower.includes('brain') && !lower.includes('substrate')) {
        throw new Error(
          `Causal chain violation: candidate ${c.candidate_id} originates from executive, not brain`,
        );
      }
    }
  }
  return true;
}

export function assertDisposition(disposition) {
  if (!DISPOSITIONS.includes(disposition)) {
    throw new Error(`Unknown disposition: ${disposition}`);
  }
  return disposition;
}

export function makeDecisionPacket(partial = {}) {
  const now = new Date().toISOString();
  return {
    decision_id: partial.decision_id || `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: partial.timestamp || now,
    evaluated_candidates: partial.evaluated_candidates || [],
    selected_disposition: partial.selected_disposition || 'DEFER',
    permitted_candidates: partial.permitted_candidates || [],
    vetoed_candidates: partial.vetoed_candidates || [],
    deferred_candidates: partial.deferred_candidates || [],
    modulation_commands: partial.modulation_commands || [],
    unresolved_contradictions: partial.unresolved_contradictions || [],
    constraint_refs: partial.constraint_refs || [],
    state_transition_refs: partial.state_transition_refs || [],
    provenance: partial.provenance || {},
  };
}
