# Technical Archival Notes: deltax-pumpbrains-chamber

**Status:** Shelved Reference Integration  
**Date:** September 18, 2026  
**Primary Focus Transition:** DeltaX engineering and causal connectome research has shifted entirely to `deltax-connectome-entity`.

---

## 1. Architecture Overview

`deltax-pumpbrains-chamber` implements a multi-channel tripartite experimental harness configured around the PumpBrains mosca sensory/behavior vocabulary (`sugar`, `bitter`, `visual`, etc. mapping to `feeding`, `escape`, `grooming`, etc.).

```
                         [ World / Stimulus ]
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       [ Matched Twin Chamber ]          [ Matched Twin Chamber ]
       (CONTROL Condition)               (EXECUTIVE Condition)
                  │                               │
        Substrate Activation            Substrate Activation
                  │                               │
       Candidate Proposals             Candidate Proposals
       [cand_1, cand_2, ...]           [cand_1, cand_2, ...]
                  │                               │
                  │                 ┌─────────────┴─────────────┐
                  │                 ▼                           │
                  │        DeltaX Executive                     │
                  │        (JSONL Child Process IPC)            │
                  │                 │                           │
                  │        Coherence & Invariant                │
                  │        Boundary Verification                │
                  │                 │                           │
                  │        Disposition & Candidate              │
                  │        Arbitration (PERMIT/VETO)            │
                  │                 │                           │
                  ▼                 ▼                           ▼
            Raw Winner        Gated Winner               OBSERVE Chamber
            Execution         Actuation                  (Telemetry Only,
                                                          Zero Mutation)
```

The system comprises three core components:
1. **`LocalTwinChamber` (`src/chamber/localTwin.js`):** A deterministic, rate-coded computational substrate that produces plausible candidate action vectors from incoming sensory stimuli while preserving identical initial internal states across chamber arms.
2. **`TwinChamberHarness` (`src/index.js`):** Coordinates synchronous stepping across `CONTROL`, `OBSERVE`, and `EXECUTIVE` arms, ensuring matched stimuli, enforcing candidate provenance, preventing motor bypass, and computing divergence metrics.
3. **Executive Interface (`src/executive/`):** An abstracted boundary supporting `stub` (offline mock), `local_runtime` (genuine local DeltaX child-process IPC over stdio JSONL), and `disabled` (strict throwing) modes.

---

## 2. Key Design Decisions & Rationales

- **JSONL stdio IPC over Local HTTP/REST:**  
  *Decision:* Use standard input/output with newline-delimited JSON for the `local_runtime` adapter.  
  *Rationale:* Eliminates port collisions, socket lifecycle leaks, background daemon management, and unauthenticated local port exposure. Guarantees tight process lifecycle binding (when the Node.js harness exits, the child runtime terminates immediately). IPC round-trip latency was measured at ~1.0–1.5ms on Apple Silicon.

- **Synchronous Invariant Evaluation Boundary:**  
  *Decision:* DeltaX evaluations must complete before actuator motor packets are dispatched; motor bypass is explicitly refused.  
  *Rationale:* Enforces the foundational DeltaX causal chain: `WORLD stimulus → brain candidate proposals → DeltaX invariant evaluation → disposition / modulation → permitted actuator path`. No executive action can execute without prior substrate proposal provenance.

- **Candidate Provenance Enforcement:**  
  *Decision:* The executive is strictly forbidden from fabricating novel candidate action identifiers absent from the substrate's emitted proposals.  
  *Rationale:* DeltaX operates as a coherence governor and invariant supervisor, not a detached black-box generator. Executive decisions must reference valid `substrate_candidate_id` entries.

- **OBSERVE Ephemeral State Isolation:**  
  *Decision:* OBSERVE calls evaluate telemetry on ephemeral state clones without advancing primary session tick sequences or writing persistent memory.  
  *Rationale:* Prevents experimental observer effects from contaminating internal executive state or biasing subsequent executive decisions.

---

## 3. What Worked Well

- **Reproducible Seed Control:** Deterministic seeding in `LocalTwinChamber` enabled exact run-to-run reproducibility across multi-seed batteries ($N=5, 25, 100$).
- **Twin Divergence Observability:** Comparing `CONTROL` (raw substrate activation winner) against `EXECUTIVE` (governed winner) cleanly surfaced candidate arbitration dynamics even under `PERMIT` dispositions.
- **Stress Resilience:** The harness demonstrated bounded stability across 10 adversarial stress scenarios (contradictory senses, sensory masking, resource scarcity, perturbation recovery) without crash, infinite loop, or invariant violation.
- **Strict Boundary Scans:** Automated boundary test suites ensured zero leakage of private runtime files, internal specifications, or proprietary DeltaX mathematics into the public repository.

---

## 4. Lessons Learned

- **Hosted PumpBrains API Limitations:**  
  An exhaustive audit of the public `https://pumpbrains.com/api` (v0.1.0) confirmed that while state polling, stimulation, and readouts are available, PumpBrains exposes **no hosted LIF checkpoint/clone endpoints** and **no real-time intervention hooks** to intercept motor actions. Consequently, a true matched twin experiment on hosted PumpBrains is technically impossible with the current public API; hosted access is limited to unmatched `OBSERVE` telemetry.
- **Candidate Arbitration vs. Hard Intervention:**  
  Divergence between `CONTROL` and `EXECUTIVE` frequently occurs without hard `VETO` or `MODULATE` events. When multiple candidates are proposed, DeltaX selects the candidate that maximizes global coherence with active invariants under `PERMIT`. This demonstrated that governance operates continuously through preference arbitration, not just emergency vetoes.
- **Stub Honesty:**  
  Rigidly segregating `deltax_stub` from `deltax_local_runtime` in provenance metadata prevented false claims of DeltaX validation in offline environments lacking the private runtime.

---

## 5. Known Limitations & Technical Debt

- **Simplified Computational Substrate:** `LocalTwinChamber` is a phenomenological rate-coded model using mosca behavioral labels, not a biophysically grounded whole-brain connectome simulation.
- **No Direct Spike-Level Interception:** Interactions occur at the candidate action / behavioral vector level rather than individual membrane potentials or synapse-specific weights.
- **Hosted Write Loop Inactive:** Automated submission to PumpBrains competition loops remains unimplemented because the primary research focus shifted to whole-CNS connectomes.

---

## 6. Rationale for Local Sovereign Architecture

Relying on external cloud APIs or third-party hosted services introduces network latency, availability fragility, API drift, credential risks, and external data leakage. Building a local-first, zero-egress test harness verified that:
1. Complete, scientifically valid twin-chamber experiments run 100% offline.
2. Proprietary DeltaX mathematics and internal algorithms remain secure in the private local runtime environment.
3. Every experimental result is fully reproducible with fixed random seeds.

---

## 7. Relationship to `deltax-connectome-entity` & Future Resumption

Active engineering effort has consolidated on `deltax-connectome-entity`, which integrates the complete 139,255-neuron adult *Drosophila* central nervous system (FlyWire Codex dataset) with anatomically identified descending neurons (DNp01, DNb01, etc.) directly into a closed-loop spatial navigation loop (`BrokenWorld`).

Should hosted PumpBrains introduce bidirectional execution sandboxes or official competition entry requirements, this repository can be resumed by following the instructions in `STATUS.md`.
