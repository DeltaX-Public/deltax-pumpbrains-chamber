import { TwinChamberHarness } from '../src/index.js';

const h = new TwinChamberHarness({ seed: 11, memoryOnly: true });
const stimuli = [
  { channel: 'sugar', intensity: 0.8 },
  { channel: 'visual', intensity: 0.9 },
  { channel: 'pheromone', intensity: 0.6 },
];

console.log('demo:stub — executive_source expected: deltax_stub\n');
for (const s of stimuli) {
  const force = s.channel === 'visual' ? 'VETO' : s.channel === 'pheromone' ? 'MODULATE' : 'PERMIT';
  const r = await h.step(s, {
    forceDisposition: force,
    constraints: force === 'VETO' ? ['invariant_veto'] : [],
  });
  console.log(JSON.stringify({
    step: r.step_id,
    stimulus: s,
    disposition: r.decisions.EXECUTIVE.selected_disposition,
    executive_source: r.executive_source,
    executed_CONTROL: r.executed.CONTROL.map((e) => e.action_class),
    executed_EXECUTIVE: r.executed.EXECUTIVE.map((e) => e.action_class),
  }, null, 2));
}
await h.close();
