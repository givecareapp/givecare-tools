# GiveCare Tools

Type: reference.

Operational guide for the public TypeScript package. Read `VISION.md` for scope.

## Map

- `src/assessments/`: instrument definitions and scoring.
- `src/scoring/`: GiveCare Score helpers.
- `src/sms/`: STOP/START/HELP and quiet hours.
- `src/geo/`: ZIP, state, area-code, and timezone helpers.
- `scripts/project-instruments.ts`: regenerates `data/instruments-export.json`.
- `GC-SDOH.md`: public instrument specification.
- `CODEMAP.md`: entry points and data flow.

```bash
npm run typecheck
npm test
npm run ci
npm run project:instruments
```

`npm run ci` is the standard gate. Instrument exports feed `gc-evals`. Change
the TypeScript owner first, then run `npm run project:instruments` to
regenerate `data/instruments-export.json`. Inspect the diff and commit the
projection on `main`. Consumers request the exact commit through the
workspace `projection-ref` command (capability `methods.assessment.project`)
and verify the committed bytes.
