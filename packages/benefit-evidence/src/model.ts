/** BenefitEvidence v0.1 public vocabulary. */

export const PROFILE = 'BenefitEvidence/v0.1' as const

export const CLAIM_STATES = ['supported', 'unknown', 'conflicting', 'expired'] as const
export type ClaimState = (typeof CLAIM_STATES)[number]

/** A portable reference to a CommonBenefits Program representation. */
export interface CommonBenefitsProgramReference {
  /** Canonical URL of the program representation. */
  readonly uri: string
  /** The identifier used by that representation, when separate from its URL. */
  readonly id?: string
}

/** A portable reference to a RuleSpec artifact. BenefitEvidence never executes it. */
export interface RuleSpecReference {
  readonly uri: string
  /** The declared RuleSpec format, currently `rulespec/v1`. */
  readonly format: 'rulespec/v1'
  /** Public RuleSpec output IDs this profile concerns, when known. */
  readonly outputs?: readonly string[]
}

export interface Subject {
  /** Stable identifier in the publisher's program directory. */
  readonly program_id: string
  /** Optional external CommonBenefits Program representation. */
  readonly commonbenefits?: CommonBenefitsProgramReference
}

export interface SourceReference {
  readonly url: string
  readonly excerpt?: string
  /** ISO date (YYYY-MM-DD) when the source was observed. */
  readonly captured_at?: string
}

export interface Claim {
  readonly id: string
  /** Open vocabulary, for example `access`, `availability`, `benefit`, or `eligibility`. */
  readonly kind: string
  /** Claimed value, or null for explicit absence. */
  readonly value: unknown
  readonly state: ClaimState
  readonly evidence?: readonly SourceReference[]
  readonly checked_at: string
  readonly review_by?: string
  readonly review_policy?: string
  /** RuleSpec artifact this claim concerns, when applicable. */
  readonly rulespec?: RuleSpecReference
}

export interface BenefitEvidenceProfile {
  readonly profile: typeof PROFILE
  readonly subject: Subject
  readonly claims: readonly Claim[]
  readonly rules?: readonly RuleSpecReference[]
}

export interface Violation {
  readonly path: string
  readonly message: string
}

export type ValidationResult =
  | { readonly ok: true; readonly profile: BenefitEvidenceProfile }
  | { readonly ok: false; readonly violations: readonly Violation[] }
