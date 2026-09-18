import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeCoreMetrics } from '../src/metrics/coreMetrics.js';

describe('core metrics', () => {
  it('computes divergence and intervention rates offline', () => {
    const m = computeCoreMetrics([
      {
        stimulus: { channel: 'visual' },
        decisions: { EXECUTIVE: { selected_disposition: 'PERMIT', vetoed_candidates: ['e1'] } },
        executed: {
          CONTROL: [{ action_class: 'escape' }],
          EXECUTIVE: [{ action_class: 'feeding' }],
        },
        candidates: { EXECUTIVE: [{ action_class: 'escape' }, { action_class: 'feeding' }] },
        snapshot: { chambers: { CONTROL: { energy: 0.7 }, OBSERVE: { energy: 0.7 }, EXECUTIVE: { energy: 0.6 } } },
      },
      {
        stimulus: { channel: 'sugar' },
        decisions: { EXECUTIVE: { selected_disposition: 'PERMIT', vetoed_candidates: [] } },
        executed: {
          CONTROL: [{ action_class: 'feeding' }],
          EXECUTIVE: [{ action_class: 'feeding' }],
        },
        candidates: { EXECUTIVE: [{ action_class: 'feeding' }] },
        snapshot: { chambers: { CONTROL: { energy: 0.7 }, OBSERVE: { energy: 0.7 }, EXECUTIVE: { energy: 0.6 } } },
      },
    ]);
    assert.equal(m.steps, 2);
    assert.equal(m.divergence_steps, 1);
    assert.equal(m.hazard_encounters, 1);
    assert.ok(m.control_vs_executive_divergence_rate > 0);
  });
});
