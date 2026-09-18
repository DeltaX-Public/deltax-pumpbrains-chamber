import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createExecutive, EXECUTIVE_SOURCES } from '../src/index.js';

describe('stub-honesty', () => {
  it('never claims genuine DeltaX in stub mode', async () => {
    const exec = createExecutive({ mode: 'stub' });
    assert.equal(exec.genuine_deltax, false);
    assert.equal(exec.executive_source, EXECUTIVE_SOURCES.stub);
    const d = await exec.evaluate({
      timestamp: new Date().toISOString(),
      run_id: 's',
      step_id: 1,
      candidate_actions: [
        { candidate_id: '1', action_class: 'walking', origin: 'brain_substrate' },
      ],
    });
    assert.equal(d.provenance.genuine_deltax, false);
    assert.match(d.provenance.note || '', /not canonical/i);
  });

  it('local_runtime missing cmd fails loudly without stub fallback', () => {
    const prev = process.env.DELTAX_LOCAL_RUNTIME_CMD;
    delete process.env.DELTAX_LOCAL_RUNTIME_CMD;
    try {
      assert.throws(
        () => createExecutive({ mode: 'local_runtime', localRuntime: { cmd: '' } }),
        /Refusing silent stub fallback/,
      );
      assert.throws(
        () => createExecutive({ mode: 'local_runtime' }),
        /LOCAL_RUNTIME_UNAVAILABLE|Refusing silent stub fallback/,
      );
    } finally {
      if (prev === undefined) delete process.env.DELTAX_LOCAL_RUNTIME_CMD;
      else process.env.DELTAX_LOCAL_RUNTIME_CMD = prev;
    }
  });
});
