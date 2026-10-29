# BenefitEvidence v0.1

BenefitEvidence is an open provenance profile for public claims about a benefit program. It records what a publisher can support, the source that supports it, when that source was checked, and whether a claim is unknown, conflicting, or expired.

It complements existing benefit standards rather than defining another program directory or eligibility language.

## Roles

- **CommonBenefits** describes Programs, Jurisdictions, application packages, households, applications, and enrollments.
- **RuleSpec** expresses executable policy logic in versioned `rulespec/v1` artifacts.
- **BenefitEvidence** describes a publisher's source-backed claims about a program or RuleSpec rule.

BenefitEvidence does not replace CommonBenefits or RuleSpec. Neither project has endorsed or adopted this profile.

## Core document

One document has one stable program subject and one or more claims. Its optional `subject.commonbenefits` reference points to a CommonBenefits Program representation. Its optional `rules` references point to RuleSpec artifacts; they are not embedded copies.

```json
{
  "profile": "BenefitEvidence/v0.1",
  "subject": {
    "program_id": "ny/example-energy-assistance",
    "commonbenefits": {
      "uri": "https://publisher.example/commonbenefits/programs/4bd4feca-f366-5261-af55-6a5f2d039557",
      "id": "4bd4feca-f366-5261-af55-6a5f2d039557"
    }
  },
  "rules": [{
    "uri": "https://publisher.example/rules/ny/example-energy-assistance.yaml",
    "format": "rulespec/v1",
    "outputs": ["ny:example-energy-assistance#eligible"]
  }],
  "claims": [{
    "id": "application-url",
    "kind": "access",
    "value": { "channel": "web", "url": "https://agency.example/apply" },
    "state": "supported",
    "evidence": [{ "url": "https://agency.example/program", "excerpt": "Apply online at agency.example/apply." }],
    "checked_at": "2026-10-28",
    "review_by": "2026-11-28"
  }]
}
```

## Claims

A claim has a stable `id`, open-vocabulary `kind`, explicit `value`, state, and `checked_at`. It may concern access, availability, an amount, a benefit, or an eligibility fact. `kind` remains open so this profile does not become a competing benefit taxonomy.

| State | Meaning |
|---|---|
| `supported` | The value has at least one source reference. |
| `unknown` | The publisher cannot support a value. |
| `conflicting` | Material sources disagree; retain the conflict. |
| `expired` | The publisher no longer considers the prior support current. |

Unknown, conflicting, and expired claims are valid outputs and must never be silently converted into supported claims.

## Minimum conformance

1. `profile: "BenefitEvidence/v0.1"` and a stable `subject.program_id`.
2. A `kind`, explicit `value`, state, and `checked_at` for every claim.
3. At least one source reference for every supported claim.
4. A `review_by` date or `review_policy` for time-sensitive claims.
5. Valid URIs and declared formats for any CommonBenefits or RuleSpec references.

The [JSON Schema](./schema/benefit-evidence.schema.json) and `@givecare/benefit-evidence` validator implement these rules.

## Out of scope

BenefitEvidence does not define a program directory, household model, application or enrollment workflow, rule language, eligibility decision, source-acquisition method, services directory, or referral taxonomy.

## Governance

BenefitEvidence v0.1 is an MIT-licensed draft maintained by GiveCare. The profile name is unbranded so independent publishers can use it. Changes should preserve claim states and stable subject identifiers or document a migration.
