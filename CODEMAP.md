# Codemap

Generated: 2026-08-06

## Architecture

The published TypeScript toolkit has zero runtime dependencies, zero I/O, and
zero framework imports. The owner-only `scripts/project-instruments.ts` script
projects its canonical instrument artifact. The package is a public-safe
subset of GiveCare domain logic. It is not a mirror of the production
`care-domain` package.

## Directory Structure

| Path | Purpose | Key Exports |
|------|---------|-------------|
| src/assessments/ | Instrument definitions + scoring | `scoreInstrument()`, `getInstrument()`, `getSdoh30QuestionsForDomains()` |
| src/scoring/ | Composite GiveCare Score (0-100) | `computeGiveCareScore()`, `computeGiveCareScoreFromInstruments()`, `detectSpike()` |
| src/sms/ | Public SMS interoperability helpers | `parseRegulatoryCommand()`, `adjustForQuietHours()` |
| src/geo/ | Geographic utilities | `inferTimezoneFromAreaCode()`, `zipToState()` |
| src/lib/ | Shared helpers | `days()` |
| scripts/ | Owner adapter | `project-instruments.ts` |

## Entry Points

| Entry | File | Description |
|-------|------|-------------|
| Main | src/index.ts | Public barrel |
| Assessments | src/assessments/instruments.ts | Subpath `@givecare/tools/assessments` |
| Scoring | src/scoring/givecareScore.ts | Subpath `@givecare/tools/scoring` |
| SMS utilities | src/sms/index.ts | Subpath `@givecare/tools/sms` |
| Regulatory SMS | src/sms/regulatory.ts | Subpath `@givecare/tools/sms/regulatory` |
| Quiet hours | src/sms/quietHours.ts | Subpath `@givecare/tools/sms/quiet-hours` |
| Geo timezone | src/geo/timezone.ts | Subpath `@givecare/tools/geo/timezone` |
| ZIP state | src/geo/zipToState.ts | Subpath `@givecare/tools/geo/zip-to-state` |

## Data Flow

```text
Instrument responses (0-4 deficit scale)
  -> scoreInstrument() [requires a complete, finite answer set; throws
     naming missing question ids otherwise] -> subscores per domain
  -> mapInstrumentToDomains() -> normalized 0-1 domain data points
  -> mergeDomainData() -> combined structural data
  -> computeDomainScores() -> domain scores 0-100
  -> computeGiveCareScore() -> composite score + band + pressures/supports
  -> flaggedDomains() -> domains eligible for a GC-SDOH-30 branch

Instrument TypeScript owner
  -> scripts/project-instruments.ts writes exact bytes + mode atomically
  -> data/instruments-export.json (commit on main)
  -> public givecare.artifact-ref/v1 -> downstream consumers sync exact bytes
```

## Key Patterns

- **Domain Model**: Six caregiver domains GC1-GC6, weighted 0.1-0.2, scored 0-100.
- **Deficit Framing**: Higher raw value = worse outcome, inverted during normalization.
- **Instrument Routing**: `mapInstrumentToDomains()` dispatches structural instruments by canonical machine ID.
- **Progressive Assessment**: GC-SDOH-6 establishes the structural baseline; GC-SDOH-30 optionally asks four more questions in one flagged domain; EMA-3 retains a native reading and updates the current composite after baseline.
- **Owner projection**: `scripts/project-instruments.ts` is the only writer for the shared instrument export. Consumers bind its verified ArtifactRef.

## Common Tasks

| Task | Steps |
|------|-------|
| Project instruments | Run `npm run project:instruments`; inspect the diff and commit on `main` |
| Add new public instrument | 1. Define in `assessments/instruments.ts` 2. Add domain mapping in `scoring/givecareScore.ts` 3. Add to `mapInstrumentToDomains()` switch |
| Add new domain | 1. Add to `GCDomainCode` + `GC_DOMAINS` 2. Add weight/label 3. Update instrument mappings and docs |
| Check package | Run `npm test && npm run build` |

## Explicit Non-Goals

- No benefits catalog or eligibility engine.
- No journey state machine.
- No Mira runtime, memory, identity, prompts, or turn planning.
- No crisis classifier or clinical decision support.
