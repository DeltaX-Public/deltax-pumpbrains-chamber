# Local Runtime Provider Contract

When `DELTAX_EXECUTIVE_MODE=local_runtime`, this harness spawns a child process and speaks **JSONL over stdin/stdout**.

## Configuration

```bash
DELTAX_EXECUTIVE_MODE=local_runtime
DELTAX_LOCAL_RUNTIME_CMD=/path/to/provider
DELTAX_LOCAL_RUNTIME_ARGS=arg1 arg2
```

If `DELTAX_LOCAL_RUNTIME_CMD` is missing, spawn fails, or the process errors/times out, the harness **throws** with `LOCAL_RUNTIME_UNAVAILABLE` (or related codes). It **never** silently falls back to stub.

## Request line (stdin)

```json
{"type":"evaluate","packet":{ /* EvaluationPacket */ }}
```

## Response line (stdout)

DecisionPacket JSON (see `docs/DELTAX_INTERFACE.md`). Harness sets:

```text
provenance.executive_source = "deltax_local_runtime"
provenance.adapter = "DeltaXLocalRuntime"
```

## Dispositions

`PERMIT` | `VETO` | `MODULATE` | `DEFER` | `ESCALATE`

## Non-goals

This document does **not** describe proprietary DeltaX mathematics. The public repo does **not** ship a canonical runtime binary.
