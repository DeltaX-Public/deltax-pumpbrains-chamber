# PumpBrains API Audit (honest)

**API base:** `https://pumpbrains.com/api`  
**OpenAPI:** `https://pumpbrains.com/api/openapi.json` (v0.1.0)  
**Audit date:** 2026-09-17 (PT)

## Legend

| Label | Meaning |
|-------|---------|
| **SUPPORTED** | Public endpoint exists and is usable by this harness |
| **PARTIALLY** | Endpoint exists but incomplete for our experiment needs |
| **NOT EXPOSED** | Needed capability; PumpBrains does not publish it |
| **LOCAL REQUIRED** | Must be provided by local twin / local DeltaX runtime |

## REST surface

| Capability | Path | Status |
|------------|------|--------|
| List species | `GET /species` | **SUPPORTED** |
| Species detail | `GET /species/{id}` | **SUPPORTED** |
| List brains | `GET /brains` | **SUPPORTED** |
| Brain profile | `GET /brains/{slug}` | **SUPPORTED** |
| Live state | `GET /brains/{slug}/state` | **SUPPORTED** |
| Stimulate | `POST /brains/{slug}/stimulate` | **SUPPORTED** |
| Events | `GET /brains/{slug}/events` | **SUPPORTED** |
| Stimuli history | `GET /brains/{slug}/stimuli` | **SUPPORTED** |
| External readout | `POST /brains/{slug}/readout` | **SUPPORTED** (external engine only) |
| External drive | `GET /brains/{slug}/drive` | **SUPPORTED** (external engine only) |
| Connectome meta | `GET /connectome` | **SUPPORTED** |
| Global feed | `GET /feed` | **SUPPORTED** |
| Hosted LIF checkpoint download | — | **NOT EXPOSED** |
| Deterministic twin of live hosted brain | — | **NOT EXPOSED** / **LOCAL REQUIRED** |
| Canonical DeltaX mathematics | — | **NOT EXPOSED** / **LOCAL REQUIRED** |

## Mosca channels — **SUPPORTED**

`sugar`, `bitter`, `salt`, `grooming`, `pheromone`, `taste_peg`, `olfactory`, `auditory`, `wind`, `bristle`, `visual`, `ocellar`

## Mosca behaviors — **SUPPORTED**

`feeding`, `escape`, `walking`, `grooming`, `courtship`, `arousal`

## Honesty statement

PumpBrains provides brains list/profile/state/stimulate/events, external readout/drive, and WS. It does **not** provide a hosted LIF checkpoint or clone API. Matched twins in this repo use a **local chamber simulator** aligned to the public mosca channel/behavior schema — not a bit-identical PumpBrains LIF replica.
