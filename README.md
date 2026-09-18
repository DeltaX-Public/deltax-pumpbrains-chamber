# deltax-pumpbrains-chamber

Public **offline-first** twin-chamber harness with a **DeltaX executive boundary**.

Chambers: **CONTROL** · **OBSERVE** · **EXECUTIVE**  
Dispositions: **PERMIT** · **VETO** · **MODULATE** · **DEFER** · **ESCALATE**

> **Default mode is local.** The experiment runs on a local matched-twin computational substrate that uses PumpBrains mosca channel/behavior vocabulary. It does **not** require PumpBrains.com or any other external API.

> **Claim boundary:** schemas, adapters, local simulator, stub/`local_runtime` adapters, observatory, metrics, tests. Does **not** ship proprietary DeltaX mathematics or private Python runtime source.

## Causal chain

```
WORLD → stimulus → brain candidates → DeltaX evaluation → modulation → action
```

Brain candidates must exist before evaluation. Undocumented motor bypass is refused.

## Quick start (offline)

```bash
npm test
npm run demo:offline          # stub if no provider; local_runtime if DELTAX_LOCAL_RUNTIME_CMD set
npm run demo:observatory      # http://127.0.0.1:8787/observatory/
```

With the private local DeltaX provider on this machine:

```bash
export DELTAX_EXECUTIVE=local_runtime
export DELTAX_LOCAL_RUNTIME_CMD="/path/to/private-deltax-runtime/.venv/bin/python -m deltax_runtime.provider"
npm run demo:offline
```

## Executive modes

| Mode | `executive_source` | Notes |
|------|--------------------|-------|
| `stub` | `deltax_stub` | Offline reference adapter — not genuine DeltaX |
| `local_runtime` | `deltax_local_runtime` | Local JSONL child process; fails loudly if unavailable |
| `disabled` | `deltax_disabled` | Evaluate throws; no silent stub fallback |

There is **no** required HTTP DeltaX Evaluate API for this project’s default path.

## Other local demos

```bash
npm run demo:stub
npm run demo:stress
npm run demo:checkpoint
npm run demo:local-runtime   # requires DELTAX_LOCAL_RUNTIME_CMD
```

## Optional network (not required)

`npm run demo:hosted-observe` hits PumpBrains.com for OBSERVE-only telemetry. It is explicitly unmatched and is **not** the primary experiment path.

## Docs

- `docs/EXPERIMENT.md` — twin-chamber protocol
- `docs/DELTAX_INTERFACE.md` — public executive contract
- `docs/LOCAL_RUNTIME_PROVIDER.md` — JSONL provider boundary
- `docs/PUMPBRAINS_AUDIT.md` — what hosted PumpBrains actually exposes
- `docs/RESULTS_LOCAL_VERIFICATION.md` — claim-safe local results
- `branches/pumpbrains_experimental.manifest.yaml`

## License

MIT
