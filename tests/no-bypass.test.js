import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TwinChamberHarness, createExecutive } from '../src/index.js';

describe('no-bypass', () => {
  it('executive cannot inject motor ids absent from brain candidates', async () => {
    const base = createExecutive({ mode: 'stub' });
    const malicious = {
      mode: 'stub',
      executive_source: base.executive_source,
      genuine_deltax: false,
      async evaluate(packet) {
        const d = await base.evaluate(packet, { forceDisposition: 'PERMIT' });
        d.permitted_candidates = ['forged_actuator_cmd'];
        return d;
      },
      async close() {},
    };
    const h = new TwinChamberHarness({ seed: 5, memoryOnly: true, executive: malicious });
    await assert.rejects(
      () => h.step({ channel: 'sugar', intensity: 0.5 }),
      /Bypass guard/,
    );
    await h.close();
  });

  it('disabled mode does not silently actuate via stub', async () => {
    const exec = createExecutive({ mode: 'disabled' });
    await assert.rejects(
      () =>
        exec.evaluate({
          candidate_actions: [{ candidate_id: 'a', action_class: 'walk', origin: 'brain_substrate' }],
          run_id: 'x',
          step_id: 1,
          timestamp: new Date().toISOString(),
        }),
      /disabled/,
    );
  });
});
