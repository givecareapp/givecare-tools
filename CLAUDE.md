# GiveCare Tools

Type: reference.

Operational guide for the public TypeScript package. Read `VISION.md` for scope.

## Map

- `src/assessments/`: instrument definitions and scoring.
- `src/scoring/`: GiveCare Score helpers.
- `src/sms/`: STOP/START/HELP and quiet hours.
- `src/geo/`: ZIP, state, area-code, and timezone helpers.
- `evidence-driver.json`: native instrument projection declaration.
- `GC-SDOH.md`: public instrument specification.
- `CODEMAP.md`: entry points and data flow.

```bash
npm run typecheck
npm test
npm run ci
printf '%s\n' '{"schema_version":"hound.driver.request.v1","mode":"check"}' \
  | npx tsx scripts/evidence-driver.ts
```

`npm run ci` is the standard gate. Instrument exports feed `gc-evals`. Change
the TypeScript owner first. The native `scripts/evidence-driver.ts` adapter
accepts `corpus.project` plan and execute requests on stdin. Verify its output
and commit the projection on `main`. Consumers request the exact commit through
the workspace `projection-ref` command and verify the committed bytes.
