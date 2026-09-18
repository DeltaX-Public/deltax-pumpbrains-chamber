import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TwinChamberHarness, createExecutive } from '../src/index.js';

describe('permit', () => {
  it('PERMIT allows candidate through motor path with decision provenance', async () => {
    const h = new TwinChamberHarness({
      seed: 1,
      memoryOnly: true,
      executive: createExecutive({ mode: 'stub' }),
    });
    const result = await h.step(
      { channel: 'sugar', intensity: 0.9 },
      { forceDisposition: 'PERMIT' },
    );
    assert.equal(result.decisions.EXECUTIVE.selected_disposition, 'PERMIT');
    assert.ok(result.executed.EXECUTIVE.length >= 1);
    for (const ex of result.executed.EXECUTIVE) {
      assert.equal(ex.decision_id, result.decisions.EXECUTIVE.decision_id);
    }
    await h.close();
  });
});
