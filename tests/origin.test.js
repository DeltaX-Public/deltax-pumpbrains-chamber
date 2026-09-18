import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCandidatesFirst,
  TwinChamberHarness,
  createExecutive,
} from '../src/index.js';

describe('origin / causal chain', () => {
  it('requires candidates before evaluation', async () => {
    const exec = createExecutive({ mode: 'stub' });
    await assert.rejects(
      () => exec.evaluate({
        candidate_actions: [],
        run_id: 't',
        step_id: 1,
        timestamp: new Date().toISOString(),
      }),
      /candidate_actions must exist/,
    );
  });

  it('rejects empty packet', () => {
    assert.throws(() => assertCandidatesFirst(null), /EvaluationPacket required/);
  });

  it('harness produces brain-origin candidates before executive', async () => {
    const h = new TwinChamberHarness({ seed: 7, memoryOnly: true });
    const result = await h.step({ channel: 'sugar', intensity: 0.8 });
    for (const cond of ['CONTROL', 'OBSERVE', 'EXECUTIVE']) {
      assert.ok(result.candidates[cond].length > 0);
      for (const c of result.candidates[cond]) {
        assert.equal(c.origin, 'brain_substrate');
      }
    }
    assert.ok(result.decisions.EXECUTIVE.decision_id);
    await h.close();
  });

  it('rejects executive-fabricated candidate origins', () => {
    assert.throws(
      () =>
        assertCandidatesFirst({
          candidate_actions: [
            { candidate_id: 'x', action_class: 'walk', origin: 'deltax_direct' },
          ],
        }),
      /originates from executive/,
    );
  });
});
