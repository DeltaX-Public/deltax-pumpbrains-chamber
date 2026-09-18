# deltax-pumpbrains-chamber

Public **PumpBrains twin-chamber** harness with a **DeltaX executive boundary**.

Chambers: **CONTROL** · **OBSERVE** · **EXECUTIVE**  
Dispositions: **PERMIT** · **VETO** · **MODULATE** · **DEFER** · **ESCALATE**

> **Claim boundary:** schemas, adapters, local matched-twin simulator, stub executive, observatory, and tests. Does **not** ship proprietary DeltaX mathematics, private Python runtime source, or PumpBrains LIF checkpoints (PumpBrains does not expose checkpoint/clone APIs).

## Causal chain

```
WORLD → stimulus → brain candidates → DeltaX evaluation → modulation → action
```

Brain candidates **must** exist before evaluation. Undocumented motor bypass is refused.

## Quick start

```bash
npm test
npm run demo:stub
npm run demo:twin
npm run demo:observatory
```

## Executive modes

| Mode | `executive_source` | Notes |
|------|--------------------|-------|
| `stub` | `deltax_stub` | Reference adapter only — not genuine DeltaX |
| `local_runtime` | `deltax_local_runtime` | JSONL child process; **fails loudly** if unavailable |
| `disabled` | `deltax_disabled` | Evaluate throws; no silent stub fallback |

## Docs

- `docs/DELTAX_INTERFACE.md` — versioned public executive contract
- `docs/EXPERIMENT.md` — twin-chamber protocol
- `docs/PUMPBRAINS_AUDIT.md` — SUPPORTED / PARTIALLY / NOT EXPOSED / LOCAL REQUIRED
- `docs/LOCAL_RUNTIME_PROVIDER.md` — JSONL provider contract
- `branches/pumpbrains_experimental.manifest.yaml` — claim manifest

## PumpBrains (honest)

API base `https://pumpbrains.com/api` — brains list/profile/state/stimulate/events; external readout/drive; WS. Species **mosca** channels/behaviors documented in the audit. **No hosted LIF checkpoint/clone.**

## License

MIT
