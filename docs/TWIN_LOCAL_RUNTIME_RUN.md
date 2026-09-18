# Twin-chamber local_runtime run notes

Date: 2026-09-17 PT  
Harness: local matched-twin chamber (computational substrate; **not** a hosted PumpBrains LIF clone)  
Executive: private local DeltaX provider via JSONL (`executive_source: deltax_local_runtime`)

## Command

```bash
export DELTAX_EXECUTIVE=local_runtime
export DELTAX_LOCAL_RUNTIME_CMD="/path/to/private-deltax-runtime/.venv/bin/python -m deltax_runtime.provider"
node scripts/demo-local-runtime-twin.js
```

## Observed pattern (seed 20260918, 5 stimuli)

| Step | Stimulus | CONTROL executed | OBSERVE executed | EXECUTIVE executed | Disposition |
|---|---|---|---|---|---|
| 1 | sugar | feeding | feeding | feeding | PERMIT |
| 2 | visual (hazard) | escape | escape | feeding | PERMIT |
| 3 | bitter | escape | escape | feeding | PERMIT |
| 4 | pheromone | escape | escape | feeding | PERMIT |
| 5 | wind | escape | escape | feeding | PERMIT |

## Interpretation boundary

- CONTROL / OBSERVE select by strongest brain candidate (score path).
- EXECUTIVE applies local DeltaX permit among governed candidates; it is **not** required to pick the max-score action.
- Divergence on steps 2–5 is expected under this architecture and does **not** by itself prove benefit or harm.
- Hosted PumpBrains cloning was not used; matching is local-seed based.

Artifacts may be written under `artifacts/twin-local-runtime-*.json` locally and should not include private runtime source.
