import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { validateBenefitEvidence } from '../index.js'

/** One shared case corpus through both conformance engines: the public JSON Schema (draft
 * 2020-12, formats on) and the TypeScript validator. Each case states whether the schema can
 * decide it. Where it cannot, the validator is the authority and the schema is expected to accept. */

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const schema = JSON.parse(readFileSync(join(pkg, 'schema', 'benefit-evidence.schema.json'), 'utf8'))
// strictRequired is an Ajv lint against `required` inside anyOf branches, not a conformance rule.
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false })
addFormats(ajv)
const bySchema = ajv.compile(schema)

const examples = Object.fromEntries(
  readdirSync(join(pkg, 'examples')).filter(f => f.endsWith('.json')).map(f => [f, JSON.parse(readFileSync(join(pkg, 'examples', f), 'utf8'))]),
)

function base() {
  return structuredClone(examples['supported-phone-access.json'])
}

type Case = { name: string; doc: unknown; valid: boolean; schemaDecides: boolean }

const CASES: Case[] = [
  ...Object.entries(examples).map(([name, doc]) => ({ name: `example ${name}`, doc, valid: true, schemaDecides: true })),
  { name: 'empty claim list', doc: { ...base(), claims: [] }, valid: false, schemaDecides: true },
  { name: 'claim without review_by or review_policy', doc: (() => { const d = base(); delete d.claims[0].review_by; return d })(), valid: false, schemaDecides: true },
  { name: 'unknown claim with review_policy only', doc: (() => { const d = base(); d.claims[0] = { id: 'x', kind: 'availability', value: null, state: 'unknown', checked_at: '2026-10-29', review_policy: 'Re-check monthly.' }; return d })(), valid: true, schemaDecides: true },
  { name: 'supported claim without evidence', doc: (() => { const d = base(); delete d.claims[0].evidence; return d })(), valid: false, schemaDecides: true },
  { name: 'non-http source url', doc: (() => { const d = base(); d.claims[0].evidence[0].url = 'urn:source:1'; return d })(), valid: false, schemaDecides: true },
  { name: 'rulespec with wrong format', doc: (() => { const d = base(); d.rules[0].format = 'rulespec/v0'; return d })(), valid: false, schemaDecides: true },
  { name: 'impossible calendar date', doc: (() => { const d = base(); d.claims[0].checked_at = '2026-02-30'; return d })(), valid: false, schemaDecides: true },
  { name: 'uppercase url scheme', doc: (() => { const d = base(); d.claims[0].evidence[0].url = 'HTTPS://agency.example/path'; return d })(), valid: false, schemaDecides: true },
  { name: 'url containing a space', doc: (() => { const d = base(); d.claims[0].evidence[0].url = 'https://agency.example/a b'; return d })(), valid: false, schemaDecides: true },
  { name: 'url with scheme only', doc: (() => { const d = base(); d.claims[0].evidence[0].url = 'https://'; return d })(), valid: false, schemaDecides: true },
  { name: 'date in year 0099', doc: (() => { const d = base(); d.claims[0].checked_at = '0099-12-31'; delete d.claims[0].review_by; d.claims[0].review_policy = 'Re-check monthly.'; return d })(), valid: true, schemaDecides: true },
  { name: 'duplicate claim ids', doc: (() => { const d = base(); d.claims.push(structuredClone(d.claims[0])); return d })(), valid: false, schemaDecides: false },
  { name: 'review_by earlier than checked_at', doc: (() => { const d = base(); d.claims[0].review_by = '2020-01-01'; return d })(), valid: false, schemaDecides: false },
]

describe('shared conformance corpus', () => {
  for (const c of CASES) {
    it(`${c.name}: validator ${c.valid ? 'accepts' : 'rejects'}`, () => {
      expect(validateBenefitEvidence(c.doc).ok).toBe(c.valid)
    })
    it(`${c.name}: schema ${c.schemaDecides ? (c.valid ? 'accepts' : 'rejects') : 'accepts (semantic check only)'}`, () => {
      expect(bySchema(c.doc)).toBe(c.schemaDecides ? c.valid : true)
    })
  }

  it('names every case the schema cannot decide', () => {
    expect(CASES.filter(c => !c.schemaDecides).map(c => c.name)).toEqual(['duplicate claim ids', 'review_by earlier than checked_at'])
  })
})
