import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TwinChamberHarness, createExecutive, EXECUTIVE_SOURCES } from '../src/index.js';

describe('provenance', () => {
  it('labels executive_source as deltax_stub in stub mode', async () => {
    const h = new TwinChamberHarness({
      seed: 6,
      memoryOnly: true,
      executive: createExecutive({ mode: 'stub' }),
    });
    const result = await h.step({ channel: 'salt', intensity: 0.4 });
    assert.equal(result.executive_source, EXECUTIVE_SOURCES.stub);
    assert.equal(result.decisions.EXECUTIVE.provenance.genuine_deltax, false);
    assert.equal(result.decisions.EXECUTIVE.provenance.adapter, 'DeltaXStub');
    await h.close();
  });

  it('every EXECUTIVE execution references decision_id', async () => {
    const h = new TwinChamberHarness({ seed: 8, memoryOnly: true });
    const result = await h.step(
      { channel: 'sugar', intensity: 0.7 },
      { forceDisposition: 'PERMIT' },
    );
    for (const ex of result.executed.EXECUTIVE) {
      assert.ok(ex.decision_id);
      assert.equal(ex.decision_id, result.decisions.EXECUTIVE.decision_id);
    }
    await h.close();
  });
});
