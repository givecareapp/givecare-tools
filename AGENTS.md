# AGENTS.md — gc-tools

Type: reference.

This repo owns public TypeScript assessment, scoring, SMS, and geo helpers. Root
workspace `AGENTS.md` rules apply; this file adds local gates. Owner intent:
`/home/deploy/wiki/aims/givecare-instruments.md`.

## Layout

- `src/index.ts`: public barrel. Subpath exports: `assessments`, `scoring`, `sms`
  (`regulatory`, `quietHours`), `geo` (`timezone`, `zipToState`).
- `src/assessments/`: instrument definitions and scoring (`instruments.ts`), shared
  export builder (`instrumentExport.ts`).
- `src/scoring/givecareScore.ts`: composite GiveCare Score.
- `src/sms/`, `src/geo/`, `src/lib/time.ts`: SMS rules, quiet hours, area code and ZIP lookups.
- `src/__tests__/`: vitest suites, one per module.
- `scripts/project-instruments.ts` -> `data/instruments-export.json`: the committed projection.
- `GC-SDOH.md`: public instrument specification. `.givecare/module.json`: module declaration.

## Commands

```bash
npm run typecheck
npm test
npm run ci                    # standard gate: typecheck + tests
npm run build
npm run project:instruments   # regenerate data/instruments-export.json
```

## Authority

- The TypeScript instrument definitions own the public SDOH instruments. Downstream
  copies never edit them.
- `scripts/project-instruments.ts` is the only writer of `data/instruments-export.json`.
  Consumers bind its verified `givecare.artifact-ref/v1`.

## Required path

Change the TypeScript owner first, run `npm run project:instruments`, inspect the
diff, and commit the projection on `main`. Consumers (`gc-evals`) request the exact
commit through the workspace `projection-ref` command (capability
`methods.assessment.project`) and verify the committed bytes.

## Proof

Run `npm run ci` and `npm run build` before handoff. Report only checks that ran.

## Safety

- Grow the public API only for demonstrated reuse.
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

- New public instrument: define it in `assessments/instruments.ts`, add its domain
  mapping in `scoring/givecareScore.ts` and the `mapInstrumentToDomains()` switch.
- New domain: extend `GCDomainCode` and `GC_DOMAINS`, then weights, labels, mappings,
  and `GC-SDOH.md`.
- `scoreInstrument()` throws on an incomplete answer set, naming missing question ids.
