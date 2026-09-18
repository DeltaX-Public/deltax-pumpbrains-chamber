# Offline-first path

This project’s primary experiment is fully local.

## What runs offline

1. `LocalTwinChamber` — deterministic matched-twin computational substrate using PumpBrains mosca channel/behavior vocabulary.
2. DeltaX executive via `stub` (public) or `local_runtime` (private JSONL child process on the same machine).
3. Core metrics, checkpoint/perturb/replay, and observatory playback from JSON artifacts.

## What is not required

- PumpBrains.com HTTP/WebSocket APIs
- Any hosted Evaluate HTTP API
- Network access for demos or tests

## Commands

```bash
npm test
npm run demo:offline
npm run demo:observatory
```

Set `DELTAX_LOCAL_RUNTIME_CMD` only when you want genuine local DeltaX instead of the stub.

## Hosted PumpBrains (optional)

`npm run demo:hosted-observe` is OBSERVE-only and unmatched. Hosted PumpBrains does not expose checkpoint/clone or an action veto hook, so CONTROL/EXECUTIVE twins cannot be matched on the hosted service.
