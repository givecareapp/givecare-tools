# @givecare/benefit-evidence

Type: reference.

> Types, JSON Schema, validation, and examples for **BenefitEvidence v0.1**:
> source-backed claims a publisher makes about a benefit program.

BenefitEvidence lets a publisher attach source-backed public facts to a benefit
program — what it offers, who it may help, how to reach it, whether it appears
available, and how current the supporting source is — and makes uncertainty a
published state rather than a missing field. It travels alongside directory
artifacts (such as [CommonBenefits](https://commonbenefits.dev/)) and rule
artifacts (such as [RuleSpec](https://github.com/TheAxiomFoundation/axiom-rules-engine)).
It does not decide eligibility or enrollment, model a household, or define a
rule language. Neither of those projects has endorsed or adopted it.

## 30-second example

```typescript
import { validateBenefitEvidence, unresolvedClaims } from '@givecare/benefit-evidence'

const result = validateBenefitEvidence({
  profile: 'BenefitEvidence/v0.1',
  subject: { program_id: 'ny/example-respite-grant' },
  claims: [
    {
      id: 'primary-access',
      kind: 'access',
      value: { channel: 'phone', phone: '+1-555-010-0100' },
      state: 'supported',
      evidence: [{ url: 'https://agency.example/program', excerpt: 'Call 555-010-0100 to apply.' }],
      checked_at: '2026-10-28',
      review_by: '2027-04-28',
    },
    { id: 'availability', kind: 'availability', value: null, state: 'unknown', checked_at: '2026-10-28',
      review_policy: 'Re-check monthly until an intake status is published.' },
  ],
})

if (result.ok) console.log(unresolvedClaims(result.profile).map(c => c.id)) // ['availability']
else console.log(result.violations)                                        // [{ path, message }, ...]
```

Dependency-free, no I/O, no network. The same contract as JSON Schema
(draft 2020-12): `import schema from '@givecare/benefit-evidence/schema.json'`
or read `schema/benefit-evidence.schema.json`.

## Install

```bash
npm install @givecare/benefit-evidence
```

## The profile

One profile per stable program subject; any number of claims per subject.

| Field | Required | Meaning |
|---|---|---|
| `profile` | yes | `"BenefitEvidence/v0.1"` |
| `subject.program_id` | yes | The stable identifier the publisher's directory uses |
| `subject.common_benefits_program_id` | no | An external directory identifier |
| `claims[]` | yes | The source-backed claims (below) |
| `rules[].rulespec` | no | RuleSpec artifacts for the subject |

Each claim:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique within the profile |
| `kind` | yes | What the claim is about, e.g. `access`, `availability`. Open vocabulary |
| `value` | yes (may be `null`) | The claimed value; `null` is an *explicit* absence of value |
| `state` | yes | `supported` · `unknown` · `conflicting` · `expired` |
| `evidence[]` | for `supported` | Source references: `url` (required), `excerpt`, `captured_at` |
| `checked_at` | yes | `YYYY-MM-DD` the claim was last checked |
| `review_by` / `review_policy` | for time-sensitive claims | A review date, or a stated policy |
| `rulespec` | no | A RuleSpec artifact this claim concerns |

`unknown`, `conflicting` and `expired` are valid outputs. A publisher must not
silently convert any of them into a supported value; `unresolvedClaims()`
lists them and `claimsDueForReview()` lists claims whose `review_by` has
arrived.

Unknown properties are allowed: the profile is designed to be carried inside
JSON, JSON-LD, CSV rows, API responses, or linked records.

## Examples

[`examples/`](./examples/) ships one conforming document per state that needs
one: a supported phone access route, an unknown availability, and a
conflicting income limit with two retained sources. The test suite validates
every example and checks that the JSON Schema and the TypeScript validator
state the same required fields, states, and evidence rule.

## Specification

The profile text is maintained as a draft in the GiveCare benefits repository.
This package is its reference implementation and ships the schema. A future
profile version should preserve published claim states and stable program
identifiers or document a migration.

## License

MIT.
