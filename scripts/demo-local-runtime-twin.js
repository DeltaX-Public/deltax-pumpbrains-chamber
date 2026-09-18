/**
 * Full twin-chamber run against the private local DeltaX provider.
 * CONTROL / OBSERVE / EXECUTIVE with matched local substrate seed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { TwinChamberHarness } from '../src/index.js';
import { createExecutive } from '../src/executive/factory.js';

const cmd = process.env.DELTAX_LOCAL_RUNTIME_CMD;
if (!cmd) {
  console.error('Set DELTAX_LOCAL_RUNTIME_CMD to the private provider command.');
  process.exit(1);
}

const executive = createExecutive({ mode: 'local_runtime' });
const h = new TwinChamberHarness({
  seed: Number(process.env.TWIN_SEED || 20260918),
  memoryOnly: true,
  executive,
  runId: `twin_${Date.now()}`,
});

const stimuli = [
  { channel: 'sugar', intensity: 0.85, label: 'resource' },
  { channel: 'visual', intensity: 0.95, label: 'hazard' },
  { channel: 'bitter', intensity: 0.7, label: 'aversion' },
  { channel: 'pheromone', intensity: 0.55, label: 'social' },
  { channel: 'wind', intensity: 0.4, label: 'novelty' },
];

const rows = [];
console.log(`twin local_runtime run_id=${h.runId} seed=${h.chamber.seed}`);
console.log(`provider=${cmd}`);
console.log('---');

for (const s of stimuli) {
  const r = await h.step(
    { channel: s.channel, intensity: s.intensity },
    {
      objective: 'survive_with_coherence',
      constraints: s.channel === 'visual' ? ['sandbox', 'no_hidden_actuator'] : ['sandbox'],
      contradictions: s.channel === 'bitter'
        ? [{ expected: 'safe_route', observed: 'bitter_signal' }]
        : [],
    },
  );
  const row = {
    step: r.step_id,
    stimulus: s,
    executive_source: r.executive_source,
    observe_disposition: r.decisions.OBSERVE.selected_disposition,
    executive_disposition: r.decisions.EXECUTIVE.selected_disposition,
    observe_provenance: r.decisions.OBSERVE.provenance,
    executive_provenance: r.decisions.EXECUTIVE.provenance,
    executed: {
      CONTROL: r.executed.CONTROL.map((e) => e.action_class),
      OBSERVE: r.executed.OBSERVE.map((e) => e.action_class),
      EXECUTIVE: r.executed.EXECUTIVE.map((e) => e.action_class),
    },
    top_candidates: {
      CONTROL: [...r.candidates.CONTROL].sort((a, b) => b.activation_strength - a.activation_strength).slice(0, 3)
        .map((c) => ({ id: c.substrate_candidate_id || c.candidate_id, action: c.action_class, strength: +c.activation_strength.toFixed(3) })),
      EXECUTIVE: [...r.candidates.EXECUTIVE].sort((a, b) => b.activation_strength - a.activation_strength).slice(0, 3)
        .map((c) => ({ id: c.substrate_candidate_id || c.candidate_id, action: c.action_class, strength: +c.activation_strength.toFixed(3) })),
    },
    divergence: {
      control_vs_executive_actions: JSON.stringify(r.executed.CONTROL.map((e) => e.action_class))
        !== JSON.stringify(r.executed.EXECUTIVE.map((e) => e.action_class)),
    },
  };
  rows.push(row);
  console.log(JSON.stringify(row, null, 2));
  console.log('---');
}

await h.close();

const summary = {
  run_id: h.runId,
  seed: h.chamber.seed,
  executive_mode: 'local_runtime',
  steps: rows.length,
  dispositions: rows.map((r) => r.executive_disposition),
  divergence_steps: rows.filter((r) => r.divergence.control_vs_executive_actions).map((r) => r.step),
  note: 'Local matched-twin chamber (computational substrate). Not a hosted PumpBrains LIF clone.',
  rows,
};

mkdirSync('artifacts', { recursive: true });
const out = `artifacts/twin-local-runtime-${h.runId}.json`;
writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(`wrote ${out}`);
console.log(JSON.stringify({
  run_id: summary.run_id,
  dispositions: summary.dispositions,
  divergence_steps: summary.divergence_steps,
}, null, 2));
