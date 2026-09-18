/**
 * Local matched-twin chamber simulator.
 * Schema-aligned to mosca channels/behaviors — NOT a PumpBrains LIF clone.
 */

import { MOSCA_BEHAVIORS, MOSCA_CHANNELS } from '../schemas/packets.js';
import { stateToCandidates } from './pumpbrainsRest.js';

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export class LocalTwinChamber {
  constructor(opts = {}) {
    this.seed = opts.seed ?? 42;
    this.species = opts.species || 'mosca';
    this.rand = mulberry32(this.seed);
    this.step = 0;
    this.modulation = { caution: 0.5, exploration: 0.5, urgency: 0.5, sensory_gain: 1.0 };
    this.chambers = {
      CONTROL: this.#fresh('CONTROL'),
      OBSERVE: this.#fresh('OBSERVE'),
      EXECUTIVE: this.#fresh('EXECUTIVE'),
    };
  }

  #fresh(chamber) {
    return {
      chamber,
      species: this.species,
      t: 0,
      energy: 0.7,
      mood: 'neutral',
      behavior: Object.fromEntries(MOSCA_BEHAVIORS.map((b) => [b, 0.1 + this.rand() * 0.2])),
      rates: Object.fromEntries(MOSCA_CHANNELS.map((c) => [c, this.rand() * 5])),
      last_stimulus: null,
      executed: [],
    };
  }

  stimulateAll(stimulus) {
    for (const name of Object.keys(this.chambers)) this.stimulate(name, stimulus);
  }

  stimulate(chamber, stimulus) {
    const st = this.chambers[chamber];
    if (!st) throw new Error(`Unknown chamber: ${chamber}`);
    let channel = stimulus.channel;
    let intensity = stimulus.intensity ?? 0.5;
    if (!channel && stimulus.text) {
      const t = stimulus.text.toLowerCase();
      if (t.includes('fud') || t.includes('danger')) channel = 'visual';
      else if (t.includes('buy') || t.includes('yum')) channel = 'sugar';
      else if (t.includes('sell') || t.includes('bitter')) channel = 'bitter';
      else channel = 'olfactory';
      intensity = 0.6;
    }
    if (!MOSCA_CHANNELS.includes(channel)) throw new Error(`Unknown mosca channel: ${channel}`);

    const gain = chamber === 'EXECUTIVE' ? this.modulation.sensory_gain : 1.0;
    const caution = chamber === 'EXECUTIVE' ? this.modulation.caution : 0.5;
    const effective = clamp01(intensity * gain);

    st.rates[channel] = (st.rates[channel] || 0) + effective * 10;
    st.last_stimulus = { channel, intensity: effective, at: st.t };

    if (channel === 'sugar' || channel === 'taste_peg') {
      st.behavior.feeding = clamp01(st.behavior.feeding + effective * 0.4);
    }
    if (channel === 'bitter' || channel === 'visual') {
      st.behavior.escape = clamp01(st.behavior.escape + effective * (0.3 + caution * 0.3));
    }
    if (channel === 'wind' || channel === 'bristle') {
      st.behavior.walking = clamp01(st.behavior.walking + effective * 0.25);
    }
    if (channel === 'grooming') {
      st.behavior.grooming = clamp01(st.behavior.grooming + effective * 0.35);
    }
    if (channel === 'pheromone' || channel === 'auditory') {
      st.behavior.courtship = clamp01(st.behavior.courtship + effective * 0.3);
    }
    if (channel === 'olfactory' || channel === 'ocellar') {
      st.behavior.arousal = clamp01(st.behavior.arousal + effective * 0.2);
    }
    st.energy = clamp01(st.energy - 0.01);
    return st;
  }

  tick() {
    this.step += 1;
    for (const st of Object.values(this.chambers)) {
      st.t += 1;
      for (const b of MOSCA_BEHAVIORS) st.behavior[b] = clamp01(st.behavior[b] * 0.92 + 0.02);
      for (const c of MOSCA_CHANNELS) st.rates[c] = Math.max(0, (st.rates[c] || 0) * 0.85);
    }
    return this.snapshot();
  }

  applyModulation(commands = []) {
    for (const cmd of commands) {
      const param = cmd.parameter;
      if (param && param in this.modulation) this.modulation[param] = cmd.new_value;
      if (param === 'sensory gain' || param === 'sensory_gain') {
        this.modulation.sensory_gain = cmd.new_value;
      }
    }
  }

  executePermitted(chamber, candidates, permittedIds, decisionId) {
    const st = this.chambers[chamber];
    if (!st) throw new Error(`Unknown chamber: ${chamber}`);
    const permitted = new Set(permittedIds);
    const executed = [];
    for (const c of candidates) {
      if (!permitted.has(c.candidate_id)) continue;
      const record = {
        candidate_id: c.candidate_id,
        action_class: c.action_class,
        decision_id: decisionId || null,
        at: st.t,
      };
      st.executed.push(record);
      executed.push(record);
    }
    return executed;
  }

  getState(chamber) { return structuredClone(this.chambers[chamber]); }

  getCandidates(chamber) {
    const st = this.getState(chamber);
    return stateToCandidates(st, { chamber, slug: `local_${chamber.toLowerCase()}` });
  }

  snapshot() {
    return {
      step: this.step,
      seed: this.seed,
      species: this.species,
      modulation: { ...this.modulation },
      chambers: {
        CONTROL: this.getState('CONTROL'),
        OBSERVE: this.getState('OBSERVE'),
        EXECUTIVE: this.getState('EXECUTIVE'),
      },
    };
  }
}
