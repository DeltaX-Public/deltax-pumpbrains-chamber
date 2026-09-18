# Local verification results (claim-safe)

Date: 2026-09-17 PT  
Scope: local matched-twin chamber + private `local_runtime` DeltaX provider.  
**Not** a hosted PumpBrains LIF clone. **Not** matched executive control of hosted brains.

## 1. Divergence stress run

Branch computational rule: under `invariant_veto` / `forbid_escape`, escape candidates are lambda-suppressed. Overall disposition may still be `PERMIT` for a remaining safe candidate.

Observed pattern:
- CONTROL/OBSERVE continue to execute strongest brain candidate (often `escape` after hazard).
- EXECUTIVE vetoes `escape` and executes an admitted alternative (e.g. `feeding`).
- Candidate-level veto is visible even when disposition stays `PERMIT`.

This demonstrates the intended causal chain: brain proposes → DeltaX gates → action path, with CONTROL≠EXECUTIVE divergence under hazard invariants.

## 2. Checkpoint → perturb → replay

Experimenter authority is separate from DeltaX:
- checkpoint / restore / hazard_boost perturbation are labeled `EXPERIMENTER`
- executive evaluations remain `DELTAX` / `local_runtime`

Restore returned chamber step to the checkpoint; subsequent step executed feeding again under sugar stimulus.

## 3. Hosted PumpBrains OBSERVE-only

Live read of a hosted brain (state/events; stimulate if allowed).  
Explicitly unmatched to local twins; no claim of executive gating on hosted LIF.

## Interpretation boundary

Do not claim consciousness, AGI, biological prefrontal function, or that DeltaX improves intelligence. These runs measure the implemented control boundary on a computational substrate.
