/**
 * BenefitEvidence v0.1: source-backed claims a publisher makes about one benefit program.
 *
 * The profile makes uncertainty a published state rather than a missing field. It does not
 * decide eligibility or enrollment, model a household, or define a rule language. The JSON
 * Schema in ../schema/benefit-evidence.schema.json states the same contract for other
 * languages; `validateBenefitEvidence` is the dependency-free TypeScript check.
 */

export const PROFILE = 'BenefitEvidence/v0.1' as const

export const CLAIM_STATES = ['supported', 'unknown', 'conflicting', 'expired'] as const
export type ClaimState = (typeof CLAIM_STATES)[number]

export interface Subject {
  /** The stable identifier the publisher's directory uses for this program. */
  readonly program_id: string
  readonly common_benefits_program_id?: string
}

export interface SourceReference {
  readonly url: string
  readonly excerpt?: string
  /** ISO date (YYYY-MM-DD) the source was captured. */
  readonly captured_at?: string
}

export interface Claim {
  readonly id: string
  /** What the claim is about, for example `access` or `availability`. Open vocabulary. */
  readonly kind: string
  /** The claimed value, or `null` for an explicit absence of value. The key is always present. */
  readonly value: unknown
  readonly state: ClaimState
  readonly evidence?: readonly SourceReference[]
  /** ISO date (YYYY-MM-DD) the claim was last checked. */
  readonly checked_at: string
  /** ISO date (YYYY-MM-DD) by which the claim should be reviewed. */
  readonly review_by?: string
  /** A stated review policy, for claims without a fixed review date. */
  readonly review_policy?: string
  /** A RuleSpec artifact this claim concerns, when it concerns a rule. */
  readonly rulespec?: string
}

export interface RuleLink {
  readonly rulespec: string
}

export interface BenefitEvidenceProfile {
  readonly profile: typeof PROFILE
  readonly subject: Subject
  readonly claims: readonly Claim[]
  readonly rules?: readonly RuleLink[]
}

export interface Violation {
  /** JSON-pointer-like path to the offending value, for example `claims/0/evidence`. */
  readonly path: string
  readonly message: string
}

export type ValidationResult =
  | { readonly ok: true; readonly profile: BenefitEvidenceProfile }
  | { readonly ok: false; readonly violations: readonly Violation[] }

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
  const state = claim.state
  if (!(CLAIM_STATES as readonly unknown[]).includes(state)) {
    out.push({ path: `${path}/state`, message: `state must be one of ${CLAIM_STATES.join(', ')}` })
  }
  if ('evidence' in claim) {
    if (!Array.isArray(claim.evidence)) out.push({ path: `${path}/evidence`, message: 'evidence must be an array of sources' })
    else claim.evidence.forEach((source, i) => checkSource(source, `${path}/evidence/${i}`, out))
  }
  if (state === 'supported' && (!Array.isArray(claim.evidence) || claim.evidence.length === 0)) {
    out.push({ path: `${path}/evidence`, message: 'a supported claim needs at least one source reference' })
  }
  if (!isIsoDate(claim.checked_at)) out.push({ path: `${path}/checked_at`, message: 'checked_at must be a YYYY-MM-DD date' })
  if ('review_by' in claim) {
    if (!isIsoDate(claim.review_by)) out.push({ path: `${path}/review_by`, message: 'review_by must be a YYYY-MM-DD date' })
    else if (isIsoDate(claim.checked_at) && claim.review_by < claim.checked_at) {
      out.push({ path: `${path}/review_by`, message: 'review_by must not be earlier than checked_at' })
    }
  }
  if ('review_policy' in claim && !isNonEmptyString(claim.review_policy)) out.push({ path: `${path}/review_policy`, message: 'review_policy must be a non-empty string' })
  if ('rulespec' in claim && !isHttpUrl(claim.rulespec)) out.push({ path: `${path}/rulespec`, message: 'rulespec must be an http(s) URL' })
}

/**
 * Check one document against the BenefitEvidence v0.1 minimum conformance rules.
 * Unknown properties are allowed: the profile travels inside other formats.
 */
export function validateBenefitEvidence(input: unknown): ValidationResult {
  const out: Violation[] = []
  if (!isRecord(input)) return { ok: false, violations: [{ path: '', message: 'profile must be an object' }] }
  if (input.profile !== PROFILE) out.push({ path: 'profile', message: `profile must be '${PROFILE}'` })
  if (!isRecord(input.subject)) out.push({ path: 'subject', message: 'subject must be an object' })
  else {
    if (!isNonEmptyString(input.subject.program_id)) out.push({ path: 'subject/program_id', message: 'program_id must be a non-empty string' })
    if ('common_benefits_program_id' in input.subject && !isNonEmptyString(input.subject.common_benefits_program_id)) {
      out.push({ path: 'subject/common_benefits_program_id', message: 'common_benefits_program_id must be a non-empty string' })
    }
  }
  if (!Array.isArray(input.claims)) out.push({ path: 'claims', message: 'claims must be an array' })
  else {
    const seen = new Set<string>()
    input.claims.forEach((claim, i) => checkClaim(claim, `claims/${i}`, seen, out))
  }
  if ('rules' in input) {
    if (!Array.isArray(input.rules)) out.push({ path: 'rules', message: 'rules must be an array' })
    else input.rules.forEach((rule, i) => {
      if (!isRecord(rule) || !isHttpUrl(rule.rulespec)) out.push({ path: `rules/${i}/rulespec`, message: 'rulespec must be an http(s) URL' })
    })
  }
  if (out.length > 0) return { ok: false, violations: out }
  return { ok: true, profile: input as unknown as BenefitEvidenceProfile }
}

/** Claims whose state the publisher must not silently convert into a supported value. */
export function unresolvedClaims(profile: BenefitEvidenceProfile): readonly Claim[] {
  return profile.claims.filter(claim => claim.state !== 'supported')
}

/** Claims due for review on or before `asOf` (YYYY-MM-DD), by `review_by`. */
export function claimsDueForReview(profile: BenefitEvidenceProfile, asOf: string): readonly Claim[] {
  if (!isIsoDate(asOf)) throw new Error(`asOf must be a YYYY-MM-DD date, got '${asOf}'`)
  return profile.claims.filter(claim => claim.review_by !== undefined && claim.review_by <= asOf)
}
