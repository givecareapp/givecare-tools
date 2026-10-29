# Changelog

All notable changes to `@givecare/tools` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The repository is now the GiveCare Tools collection, an npm workspace of two
  packages. `@givecare/assessment` (1.0.0) holds the GC-SDOH instruments, the
  GiveCare Score and the specification, moved from `src/` to
  `packages/assessment/`. `@givecare/benefit-evidence` (0.1.0) is new: types,
  a JSON Schema, a dependency-free validator, helpers and examples for the
  BenefitEvidence v0.1 profile.
- `@givecare/tools` 4.1.0 is the compatibility package: the same three entry
  points re-export `@givecare/assessment` and are built self-contained, so a
  Git install needs nothing else. Its export surface is pinned to 4.0.0 by a
  test. Its `main`/`types` now point into `dist/src/`.
- `data/instruments-export.json` names its new source path in its note; the
  bytes changed, so consumers re-sync the exact commit as usual.
- `scripts/check.sh` type-checks the root project and every workspace package.
- BenefitEvidence v0.1 now names its narrow interoperability boundary:
  optional links to a CommonBenefits Program representation and to declared
  `rulespec/v1` artifacts. It neither copies nor implements either standard.

- TypeScript `7.1.0-beta`, with `tsrs` (`0.18.0-ts7.1.0-dev.20260929`) as the default no-emit checker and tsc retained for builds and as the explicit `GC_TYPECHECKER=tsc` compatibility check. Emitted declarations are unchanged.
- One gate script, `scripts/check.sh`: `npm run check` (type check, then tests), `npm run check -- changed`, `npm run typecheck`, `npm run typecheck:tsc`. A misspelled or missing checker fails; checker diagnostics are the exit status.
- Heavy steps take a slot from the GiveCare host-wide pool when run inside the workspace; standalone clones run unthrottled.
- `tsconfig.json` sets `types: ["node"]`, required by TypeScript 7 for the tests' `node:` imports.
- Vitest runs only `src/**/*.test.ts`; it previously also ran the compiled copies in `dist/__tests__`.

## [4.0.0] - 2026-10-20

### Added

- First npm publication of `@givecare/tools`.
- `CITATION.cff`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`.
- README opens with a runnable 30-second example.
- Compiled tests are excluded from the published tarball.

### Removed

- `sms` and `geo` modules and their subpath exports (no consumers; the package was never published to npm).

### Changed

- **gc-tools is now the declared canonical owner of the public SDOH instrument
  definition** (ids, question prompts, domains, scale, and composite scoring
  semantics). Downstream copies gate against this repo instead of being
  hand-synced. Root `VISION.md` ownership table updated to match.
- Removed caregiver band labels (`BAND_LABELS`, `bandLabel`) from the scoring
  API. Bands (`Band`, `toBand`) remain as operator and research groupings,
  documented as unvalidated and never shown to caregivers.
- Standardized the GiveCare Score direction gloss to "higher means more
  capacity" across code comments, README, and `GC-SDOH.md`.
- Aligned the GC5 domain comment in `src/assessments/instruments.ts` to
  "Navigation".
- `dist` now loads under Node ESM: relative imports carry `.js` extensions.

### Added

- `scripts/project-instruments.ts` is the only supported writer for the
  canonical shared instrument snapshot at `data/instruments-export.json`. It
  writes exact bytes and mode atomically and prints the resulting SHA-256.
  Downstream consumers bind a public `givecare.artifact-ref/v1` for the
  committed result through the workspace `projection-ref` command. The
  public sibling `../gc-evals` syncs the exact verified artifact before
  adding its local packaging overlay.
- `src/assessments/instrumentExport.ts` — `buildInstrumentExport()`, the single
  builder behind the snapshot.
- `prepare` script (`tsc`) so a git-hosted install builds `dist` automatically.

## [3.0.0]

Baseline of the public `@givecare/tools` SDK:

- SDOH-6, EMA-3, and SDOH-30 caregiver assessment instruments with
  `scoreInstrument()` and adaptive deep-dive routing.
- Six-zone GiveCare Score model: composite scoring, bands, trend, and spike
  detection.
- Public-safe SMS utilities (STOP/START/HELP parsing, quiet-hours helpers).
- Public-safe geo helpers (ZIP → state, area code → timezone).
- Pure functions, zero I/O; MIT-licensed.
