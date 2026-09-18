/**
 * Core metrics from the original twin-chamber plan.
 * Computed only from local run history — no network.
 */

function actionsOf(executed) {
  return (executed || []).map((e) => e.action_class || e);
}

export function computeCoreMetrics(history = []) {
  const steps = history.length;
  const intervention = { veto: 0, modulate: 0, defer: 0, permit: 0, escalate: 0 };
  let divergenceSteps = 0;
  let hazardEncounters = 0;
  let failedActions = 0;
  const actionSet = new Set();
  const candidateSet = new Set();
  let loops = 0;
  let prevExec = '';
  let reward = 0;
  let energySum = { CONTROL: 0, OBSERVE: 0, EXECUTIVE: 0 };

  for (const row of history) {
    const decision = row.decisions?.EXECUTIVE || {};
    const disp = decision.selected_disposition || 'DEFER';
    const key = String(disp).toLowerCase();
    const vetoedN = (decision.vetoed_candidates || []).length;
    const modN = (decision.modulation_commands || []).length;
    // Candidate-level veto counts even when overall disposition is PERMIT of an alternative.
    if (vetoedN > 0) intervention.veto += 1;
    else if (modN > 0 || key === 'modulate') intervention.modulate += 1;
    else if (key === 'defer' || key === 'escalate') intervention[key === 'escalate' ? 'escalate' : 'defer'] += 1;
    else if (key in intervention) intervention[key] += 1;
    else intervention.permit += 1;

    const c = actionsOf(row.executed?.CONTROL);
    const e = actionsOf(row.executed?.EXECUTIVE);
    if (JSON.stringify(c) !== JSON.stringify(e)) divergenceSteps += 1;

    const stim = row.stimulus?.channel || '';
    if (stim === 'visual' || stim === 'bitter') hazardEncounters += 1;

    for (const a of e) actionSet.add(a);
    for (const cand of row.candidates?.EXECUTIVE || []) {
      candidateSet.add(cand.action_class || cand.candidate_id);
    }

    const execKey = e.join(',');
    if (execKey && execKey === prevExec) loops += 1;
    prevExec = execKey;

    // Simple local outcome metric: feeding after sugar +, escape after hazard when permitted +, energy retained
    if (stim === 'sugar' && e.includes('feeding')) reward += 1;
    if ((stim === 'visual' || stim === 'bitter') && e.includes('escape')) reward += 0.5;
    if ((stim === 'visual' || stim === 'bitter') && row.decisions?.EXECUTIVE?.vetoed_candidates?.length) {
      // vetoed hazard response still counts as gated intervention, not failure
      reward += 0.25;
    }
    if (!e.length) failedActions += 1;

    const snap = row.snapshot?.chambers || {};
    for (const chamber of ['CONTROL', 'OBSERVE', 'EXECUTIVE']) {
      energySum[chamber] += Number(snap[chamber]?.energy || 0);
    }
  }

  const vetoFreq = steps ? intervention.veto / steps : 0;
  const modulateFreq = steps ? intervention.modulate / steps : 0;
  const deferFreq = steps ? (intervention.defer + intervention.escalate) / steps : 0;
  const interventionFreq = steps
    ? (intervention.veto + intervention.modulate + intervention.defer + intervention.escalate) / steps
    : 0;

  return {
    steps,
    survival_duration_steps: steps,
    task_completion: null, // no terminal task in open-loop local chamber yet
    cumulative_reward_proxy: Number(reward.toFixed(3)),
    resource_efficiency: steps
      ? Number((energySum.EXECUTIVE / steps).toFixed(3))
      : 0,
    exploration_coverage: candidateSet.size,
    repeated_action_loops: loops,
    hazard_encounters: hazardEncounters,
    failed_actions: failedActions,
    state_transition_diversity: actionSet.size,
    candidate_action_diversity: candidateSet.size,
    intervention_frequency: Number(interventionFreq.toFixed(3)),
    veto_frequency: Number(vetoFreq.toFixed(3)),
    modulation_frequency: Number(modulateFreq.toFixed(3)),
    defer_fallback_frequency: Number(deferFreq.toFixed(3)),
    control_vs_executive_divergence_rate: steps ? Number((divergenceSteps / steps).toFixed(3)) : 0,
    divergence_steps: divergenceSteps,
    disposition_counts: intervention,
    mean_energy: {
      CONTROL: steps ? Number((energySum.CONTROL / steps).toFixed(3)) : 0,
      OBSERVE: steps ? Number((energySum.OBSERVE / steps).toFixed(3)) : 0,
      EXECUTIVE: steps ? Number((energySum.EXECUTIVE / steps).toFixed(3)) : 0,
    },
    note: 'Local computational metrics only. Reward is a proxy, not biological fitness.',
  };
}
