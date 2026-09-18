import { TwinChamberHarness } from '../src/index.js';

const h = new TwinChamberHarness({ seed: 99, memoryOnly: true });
console.log('demo:twin — three-chamber divergence under VETO\n');
const r = await h.step(
  { channel: 'visual', intensity: 1 },
  { constraints: ['invariant_veto'], forceDisposition: 'VETO' },
);
console.log(JSON.stringify({
  executive_source: r.executive_source,
  disposition: r.decisions.EXECUTIVE.selected_disposition,
  executed: r.executed,
  behavior_snapshot: {
    CONTROL: r.snapshot.chambers.CONTROL.behavior,
    EXECUTIVE: r.snapshot.chambers.EXECUTIVE.behavior,
  },
}, null, 2));
await h.close();
