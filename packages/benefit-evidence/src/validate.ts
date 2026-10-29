import { CLAIM_STATES, type BenefitEvidenceProfile, type Claim, type ValidationResult, type Violation } from './model.js'

const DATE = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/** A calendar date in YYYY-MM-DD that exists. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function checkRuleSpec(value: unknown, path: string, out: Violation[]): void {
  if (!isRecord(value)) return void out.push({ path, message: 'rulespec must be an object' })
  if (!isHttpUrl(value.uri)) out.push({ path: `${path}/uri`, message: 'uri must be an http(s) URL' })
  if (value.format !== 'rulespec/v1') out.push({ path: `${path}/format`, message: "format must be 'rulespec/v1'" })
  if ('outputs' in value && (!Array.isArray(value.outputs) || value.outputs.some(output => !isNonEmptyString(output)))) {
    out.push({ path: `${path}/outputs`, message: 'outputs must be an array of non-empty strings' })
  }
}

function checkSource(source: unknown, path: string, out: Violation[]): void {
  if (!isRecord(source)) return void out.push({ path, message: 'source must be an object' })
  if (!isHttpUrl(source.url)) out.push({ path: `${path}/url`, message: 'url must be an http(s) URL' })
  if ('excerpt' in source && typeof source.excerpt !== 'string') out.push({ path: `${path}/excerpt`, message: 'excerpt must be a string' })
  if ('captured_at' in source && !isIsoDate(source.captured_at)) out.push({ path: `${path}/captured_at`, message: 'captured_at must be a YYYY-MM-DD date' })
}

function checkClaim(claim: unknown, path: string, seen: Set<string>, out: Violation[]): void {
  if (!isRecord(claim)) return void out.push({ path, message: 'claim must be an object' })
  if (!isNonEmptyString(claim.id)) out.push({ path: `${path}/id`, message: 'id must be a non-empty string' })
  else if (seen.has(claim.id)) out.push({ path: `${path}/id`, message: `duplicate claim id '${claim.id}'` })
  else seen.add(claim.id)
  if (!isNonEmptyString(claim.kind)) out.push({ path: `${path}/kind`, message: 'kind must be a non-empty string' })
  if (!('value' in claim)) out.push({ path: `${path}/value`, message: 'value must be present; use null for an explicit absence of value' })
  if (!(CLAIM_STATES as readonly unknown[]).includes(claim.state)) out.push({ path: `${path}/state`, message: `state must be one of ${CLAIM_STATES.join(', ')}` })
  if ('evidence' in claim) {
    if (!Array.isArray(claim.evidence)) out.push({ path: `${path}/evidence`, message: 'evidence must be an array of sources' })
    else claim.evidence.forEach((source, i) => checkSource(source, `${path}/evidence/${i}`, out))
  }
  if (claim.state === 'supported' && (!Array.isArray(claim.evidence) || claim.evidence.length === 0)) out.push({ path: `${path}/evidence`, message: 'a supported claim needs at least one source reference' })
  if (!isIsoDate(claim.checked_at)) out.push({ path: `${path}/checked_at`, message: 'checked_at must be a YYYY-MM-DD date' })
  if ('review_by' in claim) {
    if (!isIsoDate(claim.review_by)) out.push({ path: `${path}/review_by`, message: 'review_by must be a YYYY-MM-DD date' })
    else if (isIsoDate(claim.checked_at) && claim.review_by < claim.checked_at) out.push({ path: `${path}/review_by`, message: 'review_by must not be earlier than checked_at' })
  }
  if ('review_policy' in claim && !isNonEmptyString(claim.review_policy)) out.push({ path: `${path}/review_policy`, message: 'review_policy must be a non-empty string' })
  if (!('review_by' in claim) && !('review_policy' in claim)) out.push({ path: `${path}/review_by`, message: 'every claim needs a review_by date or a review_policy' })
  if ('rulespec' in claim) checkRuleSpec(claim.rulespec, `${path}/rulespec`, out)
}

/** Check one document against the BenefitEvidence v0.1 minimum conformance rules. */
export function validateBenefitEvidence(input: unknown): ValidationResult {
  const out: Violation[] = []
  if (!isRecord(input)) return { ok: false, violations: [{ path: '', message: 'profile must be an object' }] }
  if (input.profile !== 'BenefitEvidence/v0.1') out.push({ path: 'profile', message: "profile must be 'BenefitEvidence/v0.1'" })
  if (!isRecord(input.subject)) out.push({ path: 'subject', message: 'subject must be an object' })
  else {
    if (!isNonEmptyString(input.subject.program_id)) out.push({ path: 'subject/program_id', message: 'program_id must be a non-empty string' })
    if ('commonbenefits' in input.subject) {
      const reference = input.subject.commonbenefits
      if (!isRecord(reference)) out.push({ path: 'subject/commonbenefits', message: 'commonbenefits must be an object' })
      else {
        if (!isHttpUrl(reference.uri)) out.push({ path: 'subject/commonbenefits/uri', message: 'uri must be an http(s) URL' })
        if ('id' in reference && !isNonEmptyString(reference.id)) out.push({ path: 'subject/commonbenefits/id', message: 'id must be a non-empty string' })
      }
    }
  }
  if (!Array.isArray(input.claims)) out.push({ path: 'claims', message: 'claims must be an array' })
  else if (input.claims.length === 0) out.push({ path: 'claims', message: 'a profile needs at least one claim' })
  else {
    const seen = new Set<string>()
    input.claims.forEach((claim, i) => checkClaim(claim, `claims/${i}`, seen, out))
  }
  if ('rules' in input) {
    if (!Array.isArray(input.rules)) out.push({ path: 'rules', message: 'rules must be an array' })
    else input.rules.forEach((rule, i) => checkRuleSpec(rule, `rules/${i}`, out))
  }
  return out.length > 0 ? { ok: false, violations: out } : { ok: true, profile: input as unknown as BenefitEvidenceProfile }
}

/** Claims whose state must not be silently converted into supported. */
export function unresolvedClaims(profile: BenefitEvidenceProfile): readonly Claim[] {
  return profile.claims.filter(claim => claim.state !== 'supported')
}

/** Claims due for review on or before `asOf` (YYYY-MM-DD). */
export function claimsDueForReview(profile: BenefitEvidenceProfile, asOf: string): readonly Claim[] {
  if (!isIsoDate(asOf)) throw new Error(`asOf must be a YYYY-MM-DD date, got '${asOf}'`)
  return profile.claims.filter(claim => claim.review_by !== undefined && claim.review_by <= asOf)
}
