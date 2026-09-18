import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TwinChamberHarness, createExecutive } from '../src/index.js';

describe('defer', () => {
  it('DEFER executes nothing on EXECUTIVE chamber', async () => {
    const h = new TwinChamberHarness({
      seed: 4,
      memoryOnly: true,
      executive: createExecutive({ mode: 'stub' }),
    });
    const result = await h.step(
      { channel: 'wind', intensity: 0.5 },
      { forceDisposition: 'DEFER' },
    );
    assert.equal(result.decisions.EXECUTIVE.selected_disposition, 'DEFER');
    assert.equal(result.executed.EXECUTIVE.length, 0);
    await h.close();
  });
});
