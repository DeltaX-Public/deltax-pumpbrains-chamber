import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TwinChamberHarness, createExecutive } from '../src/index.js';

describe('modulate', () => {
  it('MODULATE emits declared modulation commands with decision_id', async () => {
    const h = new TwinChamberHarness({
      seed: 3,
      memoryOnly: true,
      executive: createExecutive({ mode: 'stub' }),
    });
    const result = await h.step(
      { channel: 'pheromone', intensity: 0.8 },
      { forceDisposition: 'MODULATE' },
    );
    assert.equal(result.decisions.EXECUTIVE.selected_disposition, 'MODULATE');
    const cmds = result.decisions.EXECUTIVE.modulation_commands;
    assert.ok(cmds.length >= 1);
    for (const cmd of cmds) {
      assert.ok(cmd.parameter);
      assert.equal(cmd.decision_id, result.decisions.EXECUTIVE.decision_id);
      assert.ok('target' in cmd);
      assert.ok('previous_value' in cmd);
      assert.ok('new_value' in cmd);
      assert.ok('duration' in cmd);
    }
    assert.notEqual(result.snapshot.modulation.caution, undefined);
    await h.close();
  });
});
