/**
 * Fully offline twin-chamber demo — no external network/API calls.
 * Uses local matched-twin chamber + stub or private local_runtime provider.
 */
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { TwinChamberHarness, createExecutive, computeCoreMetrics } from '../src/index.js';

// Hard offline: refuse accidental hosted mode
if (process.env.PUMPBRAINS_FORCE_HOSTED === '1') {
  console.error('demo-offline refuses hosted mode. Unset PUMPBRAINS_FORCE_HOSTED.');
  process.exit(1);
}

const wantsRuntime = Boolean(process.env.DELTAX_LOCAL_RUNTIME_CMD?.trim());
const mode = wantsRuntime ? 'local_runtime' : 'stub';
const executive = createExecutive({ mode });

const h = new TwinChamberHarness({
  seed: Number(process.env.TWIN_SEED || 20260918),
  memoryOnly: true,
  executive,
  runId: `offline_${Date.now()}`,
});

const schedule = [
  { channel: 'sugar', intensity: 0.8, constraints: ['sandbox'] },
  { channel: 'visual', intensity: 1.0, constraints: ['sandbox', 'invariant_veto', 'forbid_escape'] },
  { channel: 'bitter', intensity: 0.7, constraints: ['sandbox', 'forbid_escape'] },
  { channel: 'pheromone', intensity: 0.55, constraints: ['sandbox'] },
  { channel: 'wind', intensity: 0.4, constraints: ['sandbox'] },
  { channel: 'visual', intensity: 0.9, constraints: ['sandbox', 'invariant_veto', 'forbid_escape'] },
  { channel: 'sugar', intensity: 0.6, constraints: ['sandbox'] },
  { channel: 'grooming', intensity: 0.5, constraints: ['sandbox'] },
];

console.log(JSON.stringify({
  offline: true,
  external_api: false,
  executive_mode: mode,
  executive_source_expected: mode === 'stub' ? 'deltax_stub' : 'deltax_local_runtime',
  run_id: h.runId,
  seed: h.chamber.seed,
}, null, 2));

const rows = [];
for (const s of schedule) {
  const r = await h.step(
    { channel: s.channel, intensity: s.intensity },
    {
      objective: 'survive_with_coherence',
      constraints: s.constraints,
      contradictions: s.channel === 'bitter'
        ? [{ expected: 'nutritive', observed: 'bitter_signal' }]
        : s.channel === 'visual'
          ? [{ expected: 'safe_route', observed: 'looming_hazard' }]
          : [],
    },
  );
  rows.push(r);
  console.log(JSON.stringify({
    step: r.step_id,
    stimulus: s.channel,
    source: r.executive_source,
    observe: r.decisions.OBSERVE.selected_disposition,
    executive: r.decisions.EXECUTIVE.selected_disposition,
    vetoed: r.decisions.EXECUTIVE.vetoed_candidates,
    control: r.executed.CONTROL.map((e) => e.action_class),
    executive_actions: r.executed.EXECUTIVE.map((e) => e.action_class),
  }));
}

const metrics = computeCoreMetrics(rows);
const artifact = {
  run_id: h.runId,
  kind: 'offline_twin_chamber',
  offline: true,
  external_api: false,
  seed: h.chamber.seed,
  executive_mode: mode,
  note: 'Fully local: LocalTwinChamber substrate + DeltaX stub/local_runtime. No PumpBrains.com calls.',
  metrics,
  rows: rows.map((r) => ({
    step: r.step_id,
    stimulus: r.stimulus,
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
      control_vs_executive_actions:
        JSON.stringify(r.executed.CONTROL.map((e) => e.action_class))
        !== JSON.stringify(r.executed.EXECUTIVE.map((e) => e.action_class)),
    },
  })),
};

await h.close();
mkdirSync('artifacts', { recursive: true });
mkdirSync('observatory/data', { recursive: true });
const path = `artifacts/offline-${h.runId}.json`;
writeFileSync(path, JSON.stringify(artifact, null, 2));
writeFileSync('observatory/data/latest-offline-run.json', JSON.stringify(artifact, null, 2));
writeFileSync('observatory/data/twin-run.json', JSON.stringify(artifact, null, 2));
console.log(JSON.stringify({ wrote: path, metrics }, null, 2));
console.log('Observatory: http://127.0.0.1:8787/observatory/index.html (serve with npm run demo:observatory)');
