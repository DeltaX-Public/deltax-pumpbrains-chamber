/**
 * Twin-chamber harness: CONTROL / OBSERVE / EXECUTIVE.
 * Causal chain: WORLD → stimulus → brain candidates → DeltaX → modulation → action
 */

import { LocalTwinChamber } from '../adapters/localChamber.js';
import { createExecutive } from '../executive/factory.js';
import { TelemetryRecorder } from '../telemetry/recorder.js';
import { assertCandidatesFirst, CHAMBER_CONDITIONS } from '../schemas/packets.js';

export class TwinChamberHarness {
  constructor(opts = {}) {
    this.chamber = new LocalTwinChamber({ seed: opts.seed });
    this.executive = opts.executive || createExecutive(opts.executiveOptions || { mode: 'stub' });
    this.telemetry =
      opts.telemetry ||
      new TelemetryRecorder({ runId: opts.runId, memoryOnly: opts.memoryOnly !== false });
    this.runId = this.telemetry.runId;
    this.history = [];
  }

  async step(stimulus, evalOpts = {}) {
    const stepId = this.chamber.step + 1;
    this.chamber.stimulateAll(stimulus);
    await this.telemetry.record('observation', { step_id: stepId, stimulus });

    const candidatesByChamber = {};
    for (const cond of CHAMBER_CONDITIONS) {
      candidatesByChamber[cond] = this.chamber.getCandidates(cond);
      assertCandidatesFirst({ candidate_actions: candidatesByChamber[cond] });
      await this.telemetry.record('substrate_state', {
        step_id: stepId,
        chamber: cond,
        state: this.chamber.getState(cond),
        candidate_actions: candidatesByChamber[cond],
      });
    }

    const controlCandidates = candidatesByChamber.CONTROL;
    const controlWinner = [...controlCandidates].sort(
      (a, b) => (b.activation_strength || 0) - (a.activation_strength || 0),
    )[0];
    const controlExecuted = this.chamber.executePermitted(
      'CONTROL', controlCandidates, controlWinner ? [controlWinner.candidate_id] : [], null,
    );

    const observePacket = this.#buildPacket(stepId, 'OBSERVE', candidatesByChamber.OBSERVE, evalOpts);
    const observeDecision = await this.executive.evaluate(observePacket, {
      forceDisposition: evalOpts.forceDisposition,
    });
    await this.telemetry.record('deltax_output', {
      step_id: stepId, chamber: 'OBSERVE', decision: observeDecision, applied: false,
    });
    const observeWinner = [...candidatesByChamber.OBSERVE].sort(
      (a, b) => (b.activation_strength || 0) - (a.activation_strength || 0),
    )[0];
    const observeExecuted = this.chamber.executePermitted(
      'OBSERVE', candidatesByChamber.OBSERVE, observeWinner ? [observeWinner.candidate_id] : [], null,
    );

    const execPacket = this.#buildPacket(stepId, 'EXECUTIVE', candidatesByChamber.EXECUTIVE, evalOpts);
    await this.telemetry.record('deltax_input', { step_id: stepId, packet: execPacket });
    const execDecision = await this.executive.evaluate(execPacket, {
      forceDisposition: evalOpts.forceDisposition,
    });
    await this.telemetry.record('deltax_output', {
      step_id: stepId, chamber: 'EXECUTIVE', decision: execDecision, applied: true,
    });

    if (execDecision.modulation_commands?.length) {
      this.chamber.applyModulation(execDecision.modulation_commands);
      await this.telemetry.record('executive_intervention', {
        step_id: stepId, kind: 'MODULATE',
        commands: execDecision.modulation_commands,
        decision_id: execDecision.decision_id,
      });
    }

    const vetoed = new Set(execDecision.vetoed_candidates || []);
    const deferred = new Set((execDecision.deferred_candidates || []).map((d) => d.candidate_id || d));
    let permittedIds = (execDecision.permitted_candidates || []).filter(
      (id) => !vetoed.has(id) && !deferred.has(id),
    );
    if (execDecision.selected_disposition === 'DEFER') permittedIds = [];
    if (execDecision.selected_disposition === 'VETO' && vetoed.size > 0) {
      permittedIds = permittedIds.filter((id) => !vetoed.has(id));
    }

    for (const id of permittedIds) {
      if (!candidatesByChamber.EXECUTIVE.some((c) => c.candidate_id === id)) {
        throw new Error(`Bypass guard: permitted id ${id} was not a brain candidate`);
      }
    }

    const execExecuted = this.chamber.executePermitted(
      'EXECUTIVE', candidatesByChamber.EXECUTIVE, permittedIds, execDecision.decision_id,
    );

    await this.telemetry.record('executed_action', {
      step_id: stepId, CONTROL: controlExecuted, OBSERVE: observeExecuted, EXECUTIVE: execExecuted,
    });

    this.chamber.tick();

    const result = {
      step_id: stepId,
      stimulus,
      candidates: candidatesByChamber,
      decisions: { OBSERVE: observeDecision, EXECUTIVE: execDecision },
      executed: { CONTROL: controlExecuted, OBSERVE: observeExecuted, EXECUTIVE: execExecuted },
      snapshot: this.chamber.snapshot(),
      executive_source: execDecision.provenance?.executive_source,
    };
    this.history.push(result);
    return result;
  }

  #buildPacket(stepId, chamber, candidates, evalOpts) {
    return {
      timestamp: new Date().toISOString(),
      run_id: this.runId,
      step_id: stepId,
      objective: evalOpts.objective || 'matched_twin_coherence',
      environment_state_summary: { chamber, condition: chamber },
      substrate_state_summary: this.chamber.getState(chamber),
      candidate_actions: candidates,
      recent_action_history: this.chamber.getState(chamber).executed.slice(-5),
      recent_outcomes: [],
      expected_state: {},
      observed_state: this.chamber.getState(chamber).behavior,
      detected_contradictions: evalOpts.contradictions || [],
      active_constraints: evalOpts.constraints || [],
      identity_state: { harness: 'pumpbrains_twin_chamber', species: this.chamber.species },
      continuity_state: { step: stepId, seed: this.chamber.seed },
      available_executive_actions: ['PERMIT', 'VETO', 'MODULATE', 'DEFER', 'ESCALATE'],
    };
  }

  experimenterCheckpoint() {
    const cp = this.chamber.checkpoint();
    this.telemetry.record('experimenter_checkpoint', { checkpoint: cp });
    return cp;
  }

  experimenterRestore(checkpoint) {
    const snap = this.chamber.restore(checkpoint);
    this.telemetry.record('experimenter_restore', { checkpoint_at: checkpoint?.at, snapshot_step: snap.step });
    return snap;
  }

  experimenterPerturb(kind, payload = {}) {
    const event = this.chamber.perturb(kind, payload);
    this.telemetry.record('experimenter_perturbation', event);
    return event;
  }

  async close() {
    if (this.executive?.close) await this.executive.close();
  }
}
