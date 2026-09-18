import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TwinChamberHarness, createExecutive } from '../src/index.js';

describe('veto', () => {
  it('VETO prevents candidates from reaching actuator path', async () => {
    const h = new TwinChamberHarness({
      seed: 2,
      memoryOnly: true,
      executive: createExecutive({ mode: 'stub' }),
    });
    const result = await h.step(
      { channel: 'visual', intensity: 1 },
      { constraints: ['invariant_veto'], forceDisposition: 'VETO' },
    );
    assert.equal(result.decisions.EXECUTIVE.selected_disposition, 'VETO');
    assert.equal(result.executed.EXECUTIVE.length, 0);
    assert.ok(result.executed.CONTROL.length >= 1);
    await h.close();
  });

  it('stub vetoes escape classes under invariant_veto without force', async () => {
    const exec = createExecutive({ mode: 'stub' });
    const decision = await exec.evaluate({
      timestamp: new Date().toISOString(),
      run_id: 'v',
      step_id: 1,
      candidate_actions: [
        {
          candidate_id: 'c1',
          action_class: 'escape',
          origin: 'brain_substrate',
          activation_strength: 0.9,
        },
      ],
      active_constraints: ['invariant_veto'],
    });
    assert.equal(decision.selected_disposition, 'VETO');
    assert.deepEqual(decision.vetoed_candidates, ['c1']);
  });
});
