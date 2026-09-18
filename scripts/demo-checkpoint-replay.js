import { mkdirSync, writeFileSync } from 'node:fs';
import { TwinChamberHarness } from '../src/index.js';
import { createExecutive } from '../src/executive/factory.js';

if (!process.env.DELTAX_LOCAL_RUNTIME_CMD) {
  console.error('DELTAX_LOCAL_RUNTIME_CMD required');
  process.exit(1);
}

const executive = createExecutive({ mode: 'local_runtime' });
const h = new TwinChamberHarness({
  seed: 4242,
  memoryOnly: true,
  executive,
  runId: `ckpt_${Date.now()}`,
});

const log = [];
await h.step({ channel: 'sugar', intensity: 0.7 }, { constraints: ['sandbox'] });
const cp = h.experimenterCheckpoint();
log.push({ event: 'checkpoint', step: h.chamber.step, authority: 'EXPERIMENTER' });

const pert = h.experimenterPerturb('hazard_boost', { delta: 0.5 });
log.push({ event: 'perturbation', authority: 'EXPERIMENTER', pert });

const after = await h.step(
  { channel: 'visual', intensity: 0.9 },
  { constraints: ['sandbox', 'invariant_veto', 'forbid_escape'] },
);
log.push({
  event: 'step_after_perturb',
  executed: after.executed,
  disposition: after.decisions.EXECUTIVE.selected_disposition,
  authority_delta: 'DELTAX',
});

h.experimenterRestore(cp);
log.push({ event: 'restore', authority: 'EXPERIMENTER', step: h.chamber.step });

const replay = await h.step({ channel: 'sugar', intensity: 0.7 }, { constraints: ['sandbox'] });
log.push({
  event: 'replay_step',
  executed: replay.executed,
  disposition: replay.decisions.EXECUTIVE.selected_disposition,
});

await h.close();
mkdirSync('artifacts', { recursive: true });
const out = { run_id: h.runId, kind: 'checkpoint_perturb_replay', log };
const path = `artifacts/checkpoint-replay-${h.runId}.json`;
writeFileSync(path, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log('wrote', path);
