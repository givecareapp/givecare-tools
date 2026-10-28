# AGENTS.md — gc-tools

Type: reference.

This repo owns public TypeScript assessment and scoring helpers. Root
workspace `AGENTS.md` rules apply; this file adds local gates. Owner intent:
`/home/deploy/wiki/aims/givecare-instruments.md`.

## Layout

The repo is an npm workspace: the GiveCare Tools collection.

- `packages/assessment/` — `@givecare/assessment`: `src/assessments/instruments.ts`
  (instrument definitions, `scoreInstrument()`), `src/assessments/instrumentExport.ts`
  (shared export builder), `src/scoring/givecareScore.ts` (composite GiveCare
  Score), `src/lib/time.ts`, `src/__tests__/`, and `GC-SDOH.md`, the public
  instrument specification.
- `packages/benefit-evidence/` — `@givecare/benefit-evidence`: `src/index.ts`
  (types, dependency-free validator, helpers), `schema/benefit-evidence.schema.json`
  (the same contract as JSON Schema 2020-12), `examples/`, `src/__tests__/`.
- `src/` — `@givecare/tools`, the root compatibility package: three relative
  re-exports of `packages/assessment/src`, compiled self-contained into `dist/`
  so a Git install needs no published dependency. `src/__tests__/compatibility.test.ts`
  pins its export surface to the 4.0.0 fixture; `src/__tests__/checkScript.test.ts`
  is the gate's regression suite.
- `scripts/project-instruments.ts` -> `data/instruments-export.json`: the committed
  projection, at the collection root. `.givecare/module.json`: what this repo
  produces and consumes.

## Commands

```bash
npm run check                 # the one gate: type check, then every test (`ci` is an alias)
npm run check -- changed      # after an edit; this suite is small, so it is the full gate
npm run typecheck             # tsrs (TypeScript 7.1 checker) only
npm run typecheck:tsc         # the same check with the retained tsc 7.1; GC_TYPECHECKER=tsc selects it for any check, never silently
npm test
npm run build                 # tsc emit: root compatibility dist/, then every workspace package's dist/
npm run project:instruments   # regenerate data/instruments-export.json
```

Toolchain: TypeScript `7.1.0-beta` and `tsrs` are pinned exactly. tsrs is the
default no-emit checker; tsc builds and is the explicit compatibility checker.
A missing or misspelled checker fails; diagnostics are never retried with the
other checker. `tsconfig.json` lists `types: ["node"]` because TypeScript 7 no
longer includes `@types/*` automatically and the tests use `node:fs`. Inside
the GiveCare workspace, heavy steps take a slot from the host-wide pool
(`../scripts/heavy_slot.py`); a standalone clone runs unthrottled.
`src/__tests__/checkScript.test.ts` is the regression suite for the gate; it
type-checks the root project and every `packages/*/tsconfig.json`.

## Authority

- The TypeScript instrument definitions own the public SDOH instruments. Downstream
  copies never edit them.
- `scripts/project-instruments.ts` is the only writer of `data/instruments-export.json`.
  Consumers bind its verified `givecare.artifact-ref/v1`.

## Required path

Change the TypeScript owner first, run `npm run project:instruments`, inspect the
diff, and commit the projection on `main`. Consumers (`gc-evals`, `gc-sms`) request the exact
commit through the workspace `projection-ref` command and verify the
committed bytes.

## Proof

Run `npm run check`, `npm run typecheck:tsc` and `npm run build` before handoff. Report only checks that ran.

## Safety

- Grow the public API only for demonstrated reuse. New packages are an owner
  decision; BenefitEvidence implements the profile drafted in `gc-benefits`.
- `@givecare/tools` keeps exporting exactly what 4.0.0 exported until a major
  release says otherwise.
- Keep the package dependency-free, I/O-free, and framework-free.
- No benefits catalog or eligibility engine, journey state machine, Mira runtime,
  memory, identity, prompts, turn planning, crisis classifier, or clinical decision
  support.
- Instrument licensing wall. Only GiveCare-owned instruments (GC-SDOH-6,
  GC-SDOH-30, EMA-3, the GiveCare Score) ship here, MIT. Third-party instruments
  never enter this package or any public repo without a separate redistribution
  decision. BSFC-s is permitted only as a free web assessment, never in a paid
  surface. CWBS is permitted for GiveCare use but is not current product behavior.
  Instruments in negotiation stay unavailable until licensed. Source of truth:
  `/home/deploy/wiki/aims/givecare-instruments.md`.

## Gotchas

- New public instrument: define it in `packages/assessment/src/assessments/instruments.ts`,
  add its domain mapping in `packages/assessment/src/scoring/givecareScore.ts` and the
  `mapInstrumentToDomains()` switch, then `npm run project:instruments`.
- New domain: extend `GCDomainCode` and `GC_DOMAINS`, then weights, labels, mappings,
  and `GC-SDOH.md`.
- `scoreInstrument()` throws on an incomplete answer set, naming missing question ids.

## Pointers

- Workspace map: `python3 /home/deploy/repos/givecare/scripts/givecare_protocol.py map`
