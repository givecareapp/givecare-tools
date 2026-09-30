# GiveCare Tools

Type: reference.

Operational guide for the public TypeScript package. Rules: [`AGENTS.md`](AGENTS.md).
Files and exports: [`CODEMAP.md`](CODEMAP.md). Instrument spec:
`GC-SDOH.md`.

## Commands

```bash
npm run typecheck
npm test
npm run ci                    # standard gate: typecheck + tests
npm run build
npm run project:instruments   # regenerate data/instruments-export.json
```

## Projection flow

Instrument exports feed `gc-evals`. Change the TypeScript owner first, run
`npm run project:instruments`, inspect the diff, and commit the projection on
`main`. Consumers request the exact commit through the workspace `projection-ref`
command (capability `methods.assessment.project`) and verify the committed bytes.

## Gotchas

- New public instrument: define it in `assessments/instruments.ts`, add its domain
  mapping in `scoring/givecareScore.ts` and the `mapInstrumentToDomains()` switch.
- New domain: extend `GCDomainCode` and `GC_DOMAINS`, then weights, labels, mappings,
  and `GC-SDOH.md`.
- `scoreInstrument()` throws on an incomplete answer set, naming missing question ids.
