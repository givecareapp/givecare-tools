# Codemap

Type: reference.

The published TypeScript toolkit has zero runtime dependencies, zero I/O, and zero
framework imports. It is a public-safe subset of GiveCare domain logic, not a
mirror of the production `care-domain` package.

```text
src/
  index.ts                        public barrel
  assessments/
    instruments.ts                instrument definitions and scoring
                                  (scoreInstrument, getInstrument, getSdoh30QuestionsForDomains)
    instrumentExport.ts           builds the shared instrument export from the definitions
  scoring/givecareScore.ts        composite GiveCare Score (computeGiveCareScore, detectSpike)
  sms/
    index.ts                      SMS barrel
    regulatory.ts                 STOP/START/HELP parsing (parseRegulatoryCommand)
    quietHours.ts                 quiet-hours adjustment (adjustForQuietHours)
  geo/
    index.ts                      geo barrel
    timezone.ts                   area code to timezone
    zipToState.ts                 ZIP to state
  lib/time.ts                     shared time helpers
  __tests__/                      vitest suites, one per module
scripts/project-instruments.ts    only writer of data/instruments-export.json
data/instruments-export.json      committed instrument projection for downstream consumers
GC-SDOH.md                        public instrument specification
CHANGELOG.md                      release notes
.github/workflows/ci.yml          npm ci, npm run ci, npm run build
.givecare/module.json             module declaration
```

Subpath exports (`@givecare/tools/...`): `assessments`, `scoring`, `sms`,
`sms/regulatory`, `sms/quietHours`, `geo`, `geo/timezone`, `geo/zipToState`.
