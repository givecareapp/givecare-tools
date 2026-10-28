# GiveCare Tools

Type: reference.

> Open-source TypeScript packages for caregiver support: an assessment
> standard and an evidence profile for benefit facts.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

| Package | Standard | What it lets you do |
|---|---|---|
| [`@givecare/assessment`](./packages/assessment/) | **GC-SDOH** | Score a caregiver's six social-determinant domains with GC-SDOH-6, EMA-3 and the GC-SDOH-30 bank, compute the GiveCare Score, and route to the domain that needs attention. [Specification](./packages/assessment/GC-SDOH.md). |
| [`@givecare/benefit-evidence`](./packages/benefit-evidence/) | **BenefitEvidence v0.1** | Publish and validate source-backed claims about a benefit program — access routes, availability, eligibility facts — with `unknown`, `conflicting` and `expired` as first-class states. Types, JSON Schema, validator, examples. |

Both are small, deterministic, dependency-free, I/O-free, and MIT licensed.
GC-SDOH is an assessment standard; BenefitEvidence is not another assessment,
it is the evidence and provenance profile for benefit facts. What is
deliberately **not** here: a benefits catalog (that is GiveCare's private
`gc-benefits`), a rule language (see RuleSpec), or a services standard.

## 30-second examples

```typescript
import { scoreInstrument, computeGiveCareScoreFromInstruments, flaggedDomains } from '@givecare/assessment'

const sdoh6 = scoreInstrument('gc_sdoh6', 'v2', { financial: 3, social: 2, health: 1, housing: 0, navigation: 2, burnout: 3 })
const score = computeGiveCareScoreFromInstruments([{ instrument: 'gc_sdoh6', subscores: sdoh6.subscores }])
console.log(score.score, flaggedDomains(score.domains)) // 0-100 (higher = more capacity), e.g. ['GC4', 'GC6']
```

```typescript
import { validateBenefitEvidence } from '@givecare/benefit-evidence'

const result = validateBenefitEvidence(document) // { ok: true, profile } | { ok: false, violations: [{ path, message }] }
```

Each package README has the full API.

## `@givecare/tools`: the compatibility package

This root package is `@givecare/tools`. It re-exports `@givecare/assessment` on
the same entry points it always had — `@givecare/tools`,
`@givecare/tools/assessments`, `@givecare/tools/scoring` — and is built
self-contained, so a Git or npm install of it needs nothing else. A test pins
its export surface to what 4.0.0 shipped. New code should import
`@givecare/assessment` directly.

## Working on the collection

```bash
npm ci                   # installs and links every workspace package
npm run check            # the one gate: type check every package, then every test
npm run typecheck:tsc    # the same type check with tsc instead of tsrs
npm run build            # builds the compatibility package and every workspace package
```

Instrument definitions are owned by `packages/assessment/src/assessments/instruments.ts`.
The committed projection `data/instruments-export.json` is written only by
`scripts/project-instruments.ts` (`npm run project:instruments`); downstream
copies sync the exact committed bytes.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Citation

Originally created by Ali Madad (@amadad).

```bibtex
@misc{madad_givecare_tools_2026,
  author       = {Ali Madad},
  title        = {{GiveCare Tools}: Open-source frameworks for caregiving support and social determinants of health assessment},
  howpublished = {\url{https://github.com/givecareapp/givecare-tools}},
  year         = {2026}
}
```

## License

MIT. Attribution is requested, not required: credit "GiveCare Tools" and link
to this repository when practical.
