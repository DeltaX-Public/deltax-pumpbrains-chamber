/**
 * Hosted PumpBrains OBSERVE-only pass.
 * Does NOT claim matched CONTROL/EXECUTIVE twins or executive gating of hosted LIF.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { PumpBrainsClient, stateToCandidates } from '../src/adapters/pumpbrainsRest.js';

const client = new PumpBrainsClient();
const slug = process.env.PUMPBRAINS_BRAIN_SLUG || '';
const runId = `hosted_observe_${Date.now()}`;

const brains = await client.listBrains('live');
const list = Array.isArray(brains) ? brains : brains.brains || [];
const brain = slug
  ? list.find((b) => b.slug === slug || b.id === slug) || { slug }
  : list[0];
if (!brain?.slug) {
  console.error('No live brains found');
  process.exit(1);
}

const before = await client.getState(brain.slug);
const candidatesBefore = stateToCandidates(before, { slug: brain.slug, chamber: 'HOSTED_OBSERVE' });
let stimulateResult = null;
let after = before;
try {
  // Public stimulate may work without key for some deployments; if it fails, record read-only observe.
  stimulateResult = await client.stimulate(brain.slug, { channel: 'olfactory', intensity: 0.2 });
  after = stimulateResult.state || (await client.getState(brain.slug));
} catch (e) {
  stimulateResult = { error: String(e.message || e), mode: 'read_only_fallback' };
  after = await client.getState(brain.slug);
}
const events = await client.getEvents(brain.slug).catch((e) => ({ error: String(e.message || e) }));

const out = {
  run_id: runId,
  kind: 'hosted_pumpbrains_observe_only',
  claim_boundary: 'OBSERVE-only against hosted PumpBrains. Not matched twins. Not executive control of hosted LIF.',
  brain: { slug: brain.slug, species: brain.species, engine: brain.engine, seed: brain.seed },
  before: {
    mood: before.mood || before.behaviorState,
    behavior: before.behavior,
    rates: before.rates,
    candidate_preview: candidatesBefore.slice(0, 6),
  },
  stimulate: stimulateResult,
  after: {
    mood: after.mood || after.behaviorState,
    behavior: after.behavior,
    rates: after.rates,
  },
  recent_events: Array.isArray(events) ? events.slice(0, 5) : events,
};
mkdirSync('artifacts', { recursive: true });
const path = `artifacts/hosted-observe-${runId}.json`;
writeFileSync(path, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log('wrote', path);
