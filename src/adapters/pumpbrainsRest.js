/**
 * PumpBrains REST adapter (public API).
 * Base: https://pumpbrains.com/api
 * Honest: no hosted LIF checkpoint/clone endpoints.
 */

const DEFAULT_BASE = 'https://pumpbrains.com/api';

export class PumpBrainsClient {
  constructor(opts = {}) {
    this.baseUrl = (opts.baseUrl || process.env.PUMPBRAINS_API_BASE || DEFAULT_BASE).replace(/\/$/, '');
    this.apiKey = opts.apiKey || process.env.PUMPBRAINS_API_KEY || '';
    this.fetchImpl = opts.fetchImpl || globalThis.fetch.bind(globalThis);
  }

  async #req(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth || this.apiKey) {
      if (!this.apiKey) throw new Error('PUMPBRAINS_API_KEY required for this endpoint');
      headers['x-api-key'] = this.apiKey;
    }
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method, headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`PumpBrains ${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  listSpecies() { return this.#req('/species'); }
  getSpecies(id) { return this.#req(`/species/${encodeURIComponent(id)}`); }
  listBrains(status = 'live') {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.#req(`/brains${q}`);
  }
  getBrain(slug) { return this.#req(`/brains/${encodeURIComponent(slug)}`); }
  getState(slug) { return this.#req(`/brains/${encodeURIComponent(slug)}/state`); }
  stimulate(slug, stimulus) {
    return this.#req(`/brains/${encodeURIComponent(slug)}/stimulate`, {
      method: 'POST', body: stimulus, auth: Boolean(this.apiKey),
    });
  }
  getEvents(slug) { return this.#req(`/brains/${encodeURIComponent(slug)}/events`); }
  getStimuli(slug) { return this.#req(`/brains/${encodeURIComponent(slug)}/stimuli`); }
  readout(slug, body) {
    return this.#req(`/brains/${encodeURIComponent(slug)}/readout`, { method: 'POST', body, auth: true });
  }
  drive(slug) {
    return this.#req(`/brains/${encodeURIComponent(slug)}/drive`, { method: 'GET', auth: true });
  }
  getConnectomeMeta() { return this.#req('/connectome'); }
  getFeed() { return this.#req('/feed'); }
}

/** Map behaviour scores into DeltaX candidate_actions (brain-origin only). */
export function stateToCandidates(state, meta = {}) {
  const behaviors = state?.behavior || state?.behaviours || state?.scores || {};
  const entries = Object.entries(behaviors);
  if (entries.length === 0 && Array.isArray(state?.candidates)) {
    return state.candidates.map((c) => ({
      ...c,
      origin: c.origin || 'brain_substrate',
      chamber: meta.chamber,
    }));
  }
  return entries.map(([name, score], i) => {
    const candidate_id = `${meta.slug || 'brain'}_${name}_${i}`;
    return {
    candidate_id,
    substrate_candidate_id: candidate_id,
    action_class: name,
    source_population: `behavior:${name}`,
    activation_strength: typeof score === 'number' ? score : Number(score) || 0,
    persistence: state?.persistence?.[name] ?? 0,
    supporting_state: { rates: state?.rates, mood: state?.mood, energy: state?.energy },
    conflicting_state: {},
    origin: 'brain_substrate',
    chamber: meta.chamber,
  };
  });
}
