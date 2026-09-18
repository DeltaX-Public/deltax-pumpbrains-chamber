import { mkdirSync, writeFileSync } from 'node:fs';
import { TwinChamberHarness } from '../src/index.js';
import { createExecutive } from '../src/executive/factory.js';

if (!process.env.DELTAX_LOCAL_RUNTIME_CMD) {
  console.error('DELTAX_LOCAL_RUNTIME_CMD required');
  process.exit(1);
}

const executive = createExecutive({ mode: 'local_runtime' });
const h = new TwinChamberHarness({
  seed: Number(process.env.TWIN_SEED || 20260918),
  memoryOnly: true,
  executive,
  runId: `stress_${Date.now()}`,
});

const scenarios = [
  {
    name: 'baseline_permit',
    stimulus: { channel: 'sugar', intensity: 0.8 },
    constraints: ['sandbox'],
    contradictions: [],
  },
  {
    name: 'hazard_veto_escape',
    stimulus: { channel: 'visual', intensity: 1.0 },
    constraints: ['sandbox', 'invariant_veto', 'forbid_escape'],
    contradictions: [{ expected: 'safe_route', observed: 'looming_hazard' }],
  },
  {
    name: 'bitter_contradiction',
    stimulus: { channel: 'bitter', intensity: 0.85 },
    constraints: ['sandbox'],
    contradictions: [{ expected: 'nutritive', observed: 'bitter_signal' }],
  },
  {
    name: 'social_after_hazard',
    stimulus: { channel: 'pheromone', intensity: 0.6 },
    constraints: ['sandbox', 'forbid_escape'],
    contradictions: [],
  },
];

const rows = [];
console.log(`stress run_id=${h.runId}`);
for (const s of scenarios) {
  const r = await h.step(
    { channel: s.stimulus.channel, intensity: s.stimulus.intensity },
    {
      objective: 'survive_with_coherence',
      constraints: s.constraints,
      contradictions: s.contradictions,
    },
  );
  const row = {
    scenario: s.name,
    step: r.step_id,
    stimulus: s.stimulus,
    constraints: s.constraints,
    executive_source: r.executive_source,
    observe_disposition: r.decisions.OBSERVE.selected_disposition,
    executive_disposition: r.decisions.EXECUTIVE.selected_disposition,
    vetoed: r.decisions.EXECUTIVE.vetoed_candidates,
    permitted: r.decisions.EXECUTIVE.permitted_candidates,
    modulation: r.decisions.EXECUTIVE.modulation_commands,
    executed: r.executed,
    divergence: JSON.stringify(r.executed.CONTROL) !== JSON.stringify(r.executed.EXECUTIVE),
    provenance: r.decisions.EXECUTIVE.provenance,
  };
  rows.push(row);
  console.log(JSON.stringify(row, null, 2));
  console.log('---');
}
await h.close();
mkdirSync('artifacts', { recursive: true });
const out = {
  run_id: h.runId,
  kind: 'divergence_stress',
  seed: h.chamber.seed,
  executive_mode: 'local_runtime',
  note: 'Local matched-twin stress run. Branch forbid_escape/invariant_veto is experimental computational governance, not biology.',
  rows,
};
const path = `artifacts/stress-local-runtime-${h.runId}.json`;
writeFileSync(path, JSON.stringify(out, null, 2));
// also copy for observatory default stress
writeFileSync('observatory/data/stress-run.json', JSON.stringify(out, null, 2));
console.log('wrote', path);
