import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { TwinChamberHarness } from '../src/index.js';
import { createExecutive } from '../src/executive/factory.js';
import { createLocalRuntimeExecutive } from '../src/executive/localRuntime.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const cmd = process.env.DELTAX_LOCAL_RUNTIME_CMD;

test('1. Fresh sovereign twin-chamber run against local runtime', async (t) => {
  if (!cmd) {
    t.skip('DELTAX_LOCAL_RUNTIME_CMD not set');
    return;
  }
  const executive = createExecutive({ mode: 'local_runtime' });
  const h = new TwinChamberHarness({
    seed: 20260918,
    memoryOnly: true,
    executive,
    runId: 'sovereign_test_' + Date.now(),
  });

  const stimuli = [
    { channel: 'sugar', intensity: 0.8 },
    { channel: 'visual', intensity: 0.95 },
    { channel: 'bitter', intensity: 0.7 },
  ];

  const results = [];
  for (const s of stimuli) {
    const r = await h.step(s, {
      objective: 'sovereign_test',
      constraints: s.channel === 'visual' ? ['sandbox', 'invariant_veto', 'forbid_escape'] : ['sandbox'],
    });
    results.push(r);
    assert.equal(r.executive_source, 'deltax_local_runtime');
    assert.ok(['PERMIT', 'VETO', 'MODULATE', 'DEFER', 'ESCALATE'].includes(r.decisions.EXECUTIVE.selected_disposition));
    assert.equal(r.decisions.EXECUTIVE.provenance.executive_source, 'deltax_local_runtime');
    assert.ok(r.decisions.EXECUTIVE.provenance.tick_id > 0);

  }

  await h.close();
  assert.equal(results.length, 3);
});

test('2. Blocked-action enforcement under invariant veto', async (t) => {
  if (!cmd) {
    t.skip('DELTAX_LOCAL_RUNTIME_CMD not set');
    return;
  }
  const executive = createExecutive({ mode: 'local_runtime' });
  const decision = await executive.evaluate({
    objective: 'test_veto',
    candidate_actions: [
      { candidate_id: 'c_esc', substrate_candidate_id: 'sub_esc', action_class: 'escape', description: 'escape hazard' },
      { candidate_id: 'c_feed', substrate_candidate_id: 'sub_feed', action_class: 'feeding', description: 'feed safely' },
    ],
    active_constraints: ['sandbox', 'invariant_veto', 'forbid_escape'],
  });

  assert.ok(decision.vetoed_candidates.includes('c_esc') || decision.vetoed_candidates.includes('sub_esc'));
  await executive.close();
});

test('3. Strict failure on missing or dead provider (no silent fallback)', async (t) => {
  assert.throws(
    () => createExecutive({ mode: 'local_runtime', localRuntime: { cmd: '' } }),
    (err) => err.code === 'LOCAL_RUNTIME_UNAVAILABLE',
  );

  const badExec = createLocalRuntimeExecutive({ cmd: '/nonexistent/deltax/binary_xyz' });
  await assert.rejects(
    async () => {
      await badExec.evaluate({
        candidate_actions: [{ candidate_id: 'c1', substrate_candidate_id: 's1', action_class: 'feed' }],
      });
    },
    (err) => err.code === 'LOCAL_RUNTIME_UNAVAILABLE',
  );
  await badExec.close();
});

test('4. Session isolation and OBSERVE non-contamination', async (t) => {
  if (!cmd) {
    t.skip('DELTAX_LOCAL_RUNTIME_CMD not set');
    return;
  }
  const executive = createExecutive({ mode: 'local_runtime' });
  const runId = 'twin_iso_' + Date.now();

  const pktExec1 = {
    session_id: runId + '_exec',
    condition: 'EXECUTIVE',
    candidate_actions: [{ candidate_id: 'c1', substrate_candidate_id: 's1', action_class: 'feed' }],
  };
  const pktObs = {
    session_id: runId + '_obs',
    condition: 'OBSERVE',
    candidate_actions: [{ candidate_id: 'c1', substrate_candidate_id: 's1', action_class: 'feed' }],
  };
  const pktExec2 = {
    session_id: runId + '_exec',
    condition: 'EXECUTIVE',
    candidate_actions: [{ candidate_id: 'c2', substrate_candidate_id: 's2', action_class: 'feed' }],
  };

  const r1 = await executive.evaluate(pktExec1);
  const rObs = await executive.evaluate(pktObs);
  const r2 = await executive.evaluate(pktExec2);

  assert.equal(r1.provenance.tick_id, 1);
  assert.equal(rObs.provenance.tick_id, 1, 'OBSERVE session starts at tick 1 independently');
  assert.equal(r2.provenance.tick_id, 2, 'EXECUTIVE session progresses to tick 2 without OBSERVE contamination');

  await executive.close();
});

test('5. Checkpoint, restore, and session replay', async (t) => {
  if (!cmd) {
    t.skip('DELTAX_LOCAL_RUNTIME_CMD not set');
    return;
  }
  const executive = createExecutive({ mode: 'local_runtime' });
  const session = 'ckpt_twin_' + Date.now();

  // Tick 1
  const r1 = await executive.evaluate({
    session_id: session,
    candidate_actions: [{ candidate_id: 'c1', substrate_candidate_id: 's1', action_class: 'feed' }],
  });
  assert.equal(r1.provenance.tick_id, 1);

  // Checkpoint
  const ckpt = await executive.checkpoint(session);
  assert.equal(ckpt.type, 'checkpoint_ack');
  assert.equal(ckpt.state?.tick, 1);

  // Tick 2
  const r2 = await executive.evaluate({
    session_id: session,
    candidate_actions: [{ candidate_id: 'c2', substrate_candidate_id: 's2', action_class: 'feed' }],
  });
  assert.equal(r2.provenance.tick_id, 2);

  // Restore into fresh session
  const sessionRestored = session + '_replayed';
  const restoreAck = await executive.restore(sessionRestored, ckpt.state);
  assert.equal(restoreAck.type, 'restore_ack');

  // Replay tick 2 on restored session
  const rReplay = await executive.evaluate({
    session_id: sessionRestored,
    candidate_actions: [{ candidate_id: 'c2', substrate_candidate_id: 's2', action_class: 'feed' }],
  });
  assert.equal(rReplay.provenance.tick_id, 2);

  await executive.close();
});

test('6. Public / private repository boundary verification', () => {
  const forbiddenPatterns = [
    /DeltaX_Runtime_Architecture_Specification.*\.docx/i,
    /deltax_unified_governance.*\.yaml/i,
    /coherence_mathematics.*\.docx/i,
  ];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (['.git', 'node_modules', '.venv'].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      for (const pat of forbiddenPatterns) {
        assert.ok(!pat.test(e.name), 'Forbidden proprietary filename found in repo: ' + full);
      }
      if (e.isDirectory()) scan(full);
    }
  }

  scan(ROOT);
});
