/**
 * BenefitEvidence v0.1 is a source-provenance profile for benefit programs.
 * It complements CommonBenefits Program records and RuleSpec rule artifacts;
 * it does not define either format or execute eligibility rules.
 */
export * from './model.js'
export { claimsDueForReview, isIsoDate, unresolvedClaims, validateBenefitEvidence } from './validate.js'
