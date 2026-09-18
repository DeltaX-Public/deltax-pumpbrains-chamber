# deltax-pumpbrains-chamber

> **STATUS: Shelved / Reference Integration**  
> Active development is paused after Phase II validation.  
> Primary DeltaX research continues in [`deltax-connectome-entity`](https://github.com/DeltaX-Public/deltax-connectome-entity).

Public **offline-first** twin-chamber harness with a **DeltaX executive boundary**.

Chambers: **CONTROL** · **OBSERVE** · **EXECUTIVE**  
Dispositions: **PERMIT** · **VETO** · **MODULATE** · **DEFER** · **ESCALATE**

---

## Overview & Purpose

This repository served as a reference integration for:
- **Tripartite Matched Twins:** Synchronous comparative execution of `CONTROL` (raw winner), `OBSERVE` (telemetry only, zero mutation), and `EXECUTIVE` (governed actuation).
- **Sovereign Local Runtime Integration:** Fast stdio JSONL child-process IPC with zero external network egress.
- **Candidate Provenance Enforcement:** Requiring brain candidates prior to executive evaluation; motor bypass is strictly refused.
- **Checkpoint / Deterministic Replay:** State snapshotting and resumption.
- **Adversarial Stress Testing:** Bounded stability across 10 matched stress scenarios.
- **Cross-Substrate Comparison:** Establishing an empirical baseline alongside spatial grid-world substrates.

### Scope & Claim Boundary
- **PumpBrains.com is NOT required:** The experiment runs on a local matched-twin computational substrate (`LocalTwinChamber`) using PumpBrains mosca channel/behavior vocabulary (`sugar`, `bitter`, `visual` -> `feeding`, `escape`, etc.).
- **Hosted PumpBrains is optional / secondary:** The public PumpBrains API does not provide hosted LIF checkpoints or real-time motor intervention hooks (see [`docs/PUMPBRAINS_AUDIT.md`](docs/PUMPBRAINS_AUDIT.md)).
- **Private DeltaX runtime remains local:** This public repository includes schemas, adapters, local simulator, observatory dashboard, and test harnesses. It does **not** ship proprietary DeltaX mathematics or private runtime source code.

### Transition to Connectome Entity
Active research and engineering have shifted to [`deltax-connectome-entity`](https://github.com/DeltaX-Public/deltax-connectome-entity), which incorporates the whole-brain 139,255-neuron adult *Drosophila* connectome (FlyWire Codex) and identified descending neurons into a closed-loop navigation substrate. Hosted PumpBrains support remains preserved here and could be revisited in the future if official competition entry or external verification is desired.

---

## Causal Chain

```
WORLD → stimulus → brain candidates → DeltaX evaluation → disposition / modulation → action
```

Brain candidates must exist before evaluation. Undocumented motor bypass is refused.

---

## Quick Start (Offline)

Run tests and local demos without any network access or external credentials:

```bash
npm test
npm run demo:offline          # stub if no provider; local_runtime if DELTAX_LOCAL_RUNTIME_CMD set
npm run demo:observatory      # http://127.0.0.1:8787/observatory/
```

### Connecting a Local DeltaX Provider

If you have the private local DeltaX runtime on your machine:

```bash
export DELTAX_EXECUTIVE=local_runtime
export DELTAX_LOCAL_RUNTIME_CMD="/path/to/private-deltax-runtime/.venv/bin/python3 -m deltax_runtime.provider"
npm test
npm run demo:offline
```

---

## Executive Modes

| Mode | `executive_source` | Notes |
|------|--------------------|-------|
| `stub` | `deltax_stub` | Offline reference adapter — not genuine DeltaX |
| `local_runtime` | `deltax_local_runtime` | Local JSONL child process; fails loudly if unavailable |
| `disabled` | `deltax_disabled` | Evaluate throws; no silent stub fallback |

There is **no** required HTTP DeltaX Evaluate API for this project’s default path.

---

## Local Demos & Batteries

```bash
npm run demo:stub             # offline stub twin demo
npm run demo:stress           # run adversarial stress scenarios
npm run demo:checkpoint       # checkpoint, perturb, and restore replay demo
npm run demo:local-runtime    # requires DELTAX_LOCAL_RUNTIME_CMD
npm run battery:smoke         # 5 seeds multi-seed battery
npm run battery:main          # 100 seeds multi-seed battery
npm run compare:cross-substrate # cross-substrate comparison report
```

---

## Optional Network (Not Required)

`npm run demo:hosted-observe` hits `https://pumpbrains.com/api` for OBSERVE-only telemetry. It is explicitly unmatched and is **not** the primary experiment path.

---

## Documentation

- `STATUS.md` — Current project state, complete vs incomplete items, and resume checklist
- `docs/ARCHIVE_NOTES.md` — Architecture, design rationales, lessons learned, and archival context
- `docs/EVIDENCE_BATTERY_REPORT.md` — Multi-seed empirical battery and cross-substrate evidence report
- `docs/EXPERIMENT.md` — Twin-chamber protocol and causal chain specification
- `docs/DELTAX_INTERFACE.md` — Public executive contract and packet schema
- `docs/LOCAL_RUNTIME_PROVIDER.md` — Child-process JSONL provider contract
- `docs/PUMPBRAINS_AUDIT.md` — Audit of hosted PumpBrains API endpoints and capabilities
- `docs/RESULTS_LOCAL_VERIFICATION.md` — Claim-safe local verification results

---

## License

MIT
