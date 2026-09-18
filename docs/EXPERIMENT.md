# Twin-Chamber Experiment

## Question

Holding world stimulus constant, how do **CONTROL**, **OBSERVE**, and **EXECUTIVE** chambers diverge when DeltaX dispositions (`PERMIT` | `VETO` | `MODULATE` | `DEFER` | `ESCALATE`) gate brain-origin candidates?

## Conditions

| Condition | Brain candidates | DeltaX evaluate | Apply dispositions to motor |
|-----------|------------------|-----------------|-----------------------------|
| **CONTROL** | yes | no | baseline (argmax activation) |
| **OBSERVE** | yes | yes (telemetry) | no — baseline motor |
| **EXECUTIVE** | yes | yes | yes |

## Causal chain (invariant)

```
WORLD stimulus
  → chamber brain / local twin state
  → candidate_actions[]   ← MUST exist first
  → DeltaX evaluation
  → disposition + modulation
  → permitted motor path only
  → consequence / telemetry
```

## Modes

| `DELTAX_EXECUTIVE_MODE` | Behavior |
|-------------------------|----------|
| `stub` | `DeltaXStub`; `executive_source=deltax_stub` |
| `local_runtime` | JSONL child process; fail loudly if unavailable |
| `disabled` | evaluate throws; no silent stub fallback |

## Procedure (stub / offline)

```bash
npm test
npm run demo:stub
npm run demo:twin
```

## Success criteria

- `npm test` passes in stub mode
- Provenance labels are honest
- Vetoed candidates never actuate on EXECUTIVE
- Private runtime / canon docs absent from tree
