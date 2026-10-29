import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CLAIM_STATES, PROFILE, claimsDueForReview, isIsoDate, unresolvedClaims, validateBenefitEvidence } from '../index.js'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const examples = Object.fromEntries(
  readdirSync(join(pkg, 'examples')).filter(f => f.endsWith('.json')).map(f => [f, JSON.parse(readFileSync(join(pkg, 'examples', f), 'utf8'))]),
)
const schema = JSON.parse(readFileSync(join(pkg, 'schema', 'benefit-evidence.schema.json'), 'utf8'))

function supported() {
  return structuredClone(examples['supported-phone-access.json'])
}

function violationPaths(input: unknown): string[] {
  const result = validateBenefitEvidence(input)
  return result.ok ? [] : result.violations.map(v => v.path)
}

describe('examples', () => {
  it('ships basic and upstream-reference examples', () => {
    expect(Object.keys(examples).sort()).toEqual([
      'commonbenefits-linked.json',
      'conflicting-income-limit.json',
      'rulespec-linked.json',
      'supported-phone-access.json',
      'unknown-availability.json',
    ])
  })

  for (const [name, doc] of Object.entries(examples)) {
    it(`${name} conforms`, () => {
      expect(validateBenefitEvidence(doc)).toMatchObject({ ok: true })
    })
  }
})

describe('minimum conformance', () => {
  it('1. requires the profile version and a stable program subject', () => {
    const doc = supported()
    doc.profile = 'BenefitEvidence/v0.2'
    expect(violationPaths(doc)).toContain('profile')
    const noSubject = supported()
    noSubject.subject = { program_id: '' }
    expect(violationPaths(noSubject)).toContain('subject/program_id')
  })

  it('2. requires kind, an explicit value key, and a state for every claim', () => {
    const doc = supported()
    delete doc.claims[0].value
    delete doc.claims[0].kind
    doc.claims[0].state = 'verified'
    expect(violationPaths(doc)).toEqual(expect.arrayContaining(['claims/0/value', 'claims/0/kind', 'claims/0/state']))
  })

  it('2b. null is an explicit absence of value, not a missing one', () => {
    const doc = supported()
    doc.claims[0].value = null
    expect(violationPaths(doc)).not.toContain('claims/0/value')
  })

  it('3. requires at least one source reference for a supported claim', () => {
    const doc = supported()
    doc.claims[0].evidence = []
    expect(violationPaths(doc)).toContain('claims/0/evidence')
    const missing = supported()
    delete missing.claims[0].evidence
    expect(violationPaths(missing)).toContain('claims/0/evidence')
  })

  it('3b. does not require evidence for unknown, conflicting or expired claims', () => {
    for (const state of ['unknown', 'expired']) {
      const doc = supported()
      doc.claims[0].state = state
      delete doc.claims[0].evidence
      expect(violationPaths(doc)).toEqual([])
    }
  })

  it('4. requires a real checked_at date', () => {
    for (const bad of ['2026-02-30', '28/10/2026', 20261028, undefined]) {
      const doc = supported()
      doc.claims[0].checked_at = bad
      expect(violationPaths(doc)).toContain('claims/0/checked_at')
    }
  })

  it('5. accepts review_by or review_policy, and rejects a review_by before checked_at', () => {
    const doc = supported()
    doc.claims[0].review_by = '2026-01-01'
    expect(violationPaths(doc)).toContain('claims/0/review_by')
    const policy = supported()
    delete policy.claims[0].review_by
    policy.claims[0].review_policy = ''
    expect(violationPaths(policy)).toContain('claims/0/review_policy')
  })

  it('checks every source url and structured RuleSpec links', () => {
    const doc = supported()
    doc.claims[0].evidence[0].url = 'agency.example/program'
    doc.rules[0].uri = 'not a url'
    doc.rules[0].format = 'rulespec/v0'
    expect(violationPaths(doc)).toEqual(expect.arrayContaining(['claims/0/evidence/0/url', 'rules/0/uri', 'rules/0/format']))
  })

  it('checks optional CommonBenefits program references', () => {
    const doc = supported()
    doc.subject.commonbenefits.uri = 'not a url'
    expect(violationPaths(doc)).toContain('subject/commonbenefits/uri')
  })

  it('rejects duplicate claim ids', () => {
    const doc = supported()
    doc.claims.push(structuredClone(doc.claims[0]))
    expect(violationPaths(doc)).toContain('claims/1/id')
  })

  it('allows unknown properties, because the profile travels inside other formats', () => {
    const doc = supported()
    doc.publisher = 'gc-benefits'
    doc.claims[0].note = 'carried through'
    expect(validateBenefitEvidence(doc)).toMatchObject({ ok: true })
  })

  it('reports every violation at once with a path', () => {
    const result = validateBenefitEvidence({ profile: 'x', subject: {}, claims: [{}] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.violations.length).toBeGreaterThanOrEqual(6)
      for (const v of result.violations) expect(typeof v.path).toBe('string')
    }
  })

  it('rejects a non-object document', () => {
    expect(validateBenefitEvidence(null)).toMatchObject({ ok: false })
    expect(validateBenefitEvidence([])).toMatchObject({ ok: false })
  })
})

describe('JSON Schema stays in step with the TypeScript contract', () => {
  it('states the same profile constant and claim states', () => {
    expect(schema.properties.profile.const).toBe(PROFILE)
    expect(schema.$defs.claim.properties.state.enum).toEqual([...CLAIM_STATES])
  })

  it('requires the same claim fields', () => {
    expect(schema.$defs.claim.required.sort()).toEqual(['checked_at', 'id', 'kind', 'state', 'value'])
    expect(schema.properties.subject.required).toEqual(['program_id'])
    expect(schema.required.sort()).toEqual(['claims', 'profile', 'subject'])
  })

  it('requires evidence only for supported claims', () => {
    expect(schema.$defs.claim.if.properties.state.const).toBe('supported')
    expect(schema.$defs.claim.then.required).toEqual(['evidence'])
    expect(schema.$defs.claim.then.properties.evidence.minItems).toBe(1)
  })
})

describe('helpers', () => {
  it('isIsoDate accepts real dates only', () => {
    expect(isIsoDate('2026-10-28')).toBe(true)
    expect(isIsoDate('2026-02-29')).toBe(false)
    expect(isIsoDate('2024-02-29')).toBe(true)
  })

  it('unresolvedClaims returns every claim that is not supported', () => {
    const result = validateBenefitEvidence(examples['conflicting-income-limit.json'])
    if (!result.ok) throw new Error('example should validate')
    expect(unresolvedClaims(result.profile).map(c => c.id)).toEqual(['income-limit'])
  })

  it('claimsDueForReview compares review_by to the given date', () => {
    const result = validateBenefitEvidence(examples['supported-phone-access.json'])
    if (!result.ok) throw new Error('example should validate')
    expect(claimsDueForReview(result.profile, '2027-04-27')).toEqual([])
    expect(claimsDueForReview(result.profile, '2027-04-28').map(c => c.id)).toEqual(['primary-access'])
    expect(() => claimsDueForReview(result.profile, 'tomorrow')).toThrow()
  })
})
