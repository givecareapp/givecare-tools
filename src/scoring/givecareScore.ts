import type { InstrumentName, GCDomainCode } from '../assessments/instruments.js'
import { days } from '../lib/time.js'

export type { GCDomainCode }

export const GC_DOMAINS: GCDomainCode[] = ['GC1', 'GC2', 'GC3', 'GC4', 'GC5', 'GC6']

export const GC_DOMAIN_LABELS: Record<GCDomainCode, string> = {
  GC1: 'Social Support',
  GC2: 'Physical Health',
  GC3: 'Housing & Environment',
  GC4: 'Financial Resources',
  GC5: 'Navigation',
  GC6: 'Emotional Wellbeing',
}

export const GC_DOMAIN_WEIGHTS: Record<GCDomainCode, number> = {
  GC1: 0.2,
  GC2: 0.2,
  GC3: 0.1,
  GC4: 0.2,
  GC5: 0.1,
  GC6: 0.2,
}

/**
 * GC-SDOH-6 item id -> GiveCare domain. One canonical decision site,
 * shared by `mapSdoh6ToDomains` and the instrument export (`buildInstrumentExport`)
 * so the mapping cannot drift between scoring and the published snapshot.
 */
export const SDOH6_DOMAIN_MAP: Record<string, GCDomainCode> = {
  social: 'GC1',
  health: 'GC2',
  housing: 'GC3',
  financial: 'GC4',
  navigation: 'GC5',
  burnout: 'GC6',
}

export type Band = 'strong' | 'steady' | 'building' | 'needs_attention'

/**
 * Operator and research grouping only. Not a validated cutoff. Never shown
 * to caregivers.
 */
export function toBand(score: number): Band {
  if (score >= 75) return 'strong'
  if (score >= 50) return 'steady'
  if (score >= 25) return 'building'
  return 'needs_attention'
}

export type ConfidenceLevel = 'early_estimate' | 'building' | 'solid'

export function getConfidence(completedInstruments: string[]): ConfidenceLevel {
  const count = completedInstruments.length
  if (count <= 1) return 'early_estimate'
  if (count === 2) return 'building'
  return 'solid'
}

export interface DomainDataPoint {
  value: number // normalized 0-1
  instrument: string
}

export type DomainScores = Partial<Record<GCDomainCode, number>>
export type DomainData = Partial<Record<GCDomainCode, DomainDataPoint[]>>

function normalizeItem(raw: number, min: number, max: number, invert: boolean): number {
  const range = max - min
  if (range === 0) return 0
  const normalized = (raw - min) / range
  const clamped = Math.max(0, Math.min(1, normalized))
  return invert ? 1 - clamped : clamped
}

/** Map EMA-3 subscores to domains. stress → GC2 (inverted), mood+coping → GC6 (direct) */
export function mapEma3ToDomains(subscores: Record<string, number>): DomainData {
  const data: DomainData = {}
  if (subscores.stress !== undefined) {
    data.GC2 = [{ value: normalizeItem(subscores.stress, 0, 4, true), instrument: 'ema3' }]
  }
  const emotionalItems: DomainDataPoint[] = []
  if (subscores.mood !== undefined) {
    emotionalItems.push({ value: normalizeItem(subscores.mood, 0, 4, false), instrument: 'ema3' })
  }
  if (subscores.coping !== undefined) {
    emotionalItems.push({ value: normalizeItem(subscores.coping, 0, 4, false), instrument: 'ema3' })
  }
  if (emotionalItems.length > 0) data.GC6 = emotionalItems
  return data
}

/** Map GC-SDOH-6 subscores to domains. Deficit-framed (higher raw = worse). */
export function mapSdoh6ToDomains(subscores: Record<string, number>): DomainData {
  const data: DomainData = {}
  for (const [key, domain] of Object.entries(SDOH6_DOMAIN_MAP)) {
    if (subscores[key] !== undefined) {
      data[domain] = [{ value: normalizeItem(subscores[key], 0, 4, true), instrument: 'gc_sdoh6' }]
    }
  }
  return data
}

/** Map GC-SDOH-30 responses to domain data points. Deficit-framed 0-4. */
export function mapSdoh30ToDomains(
  responses: Array<{ questionId: string; value: number }>
): DomainData {
  const data: DomainData = {}
  for (const { questionId, value } of responses) {
    const domain = questionId.split('-')[0] as GCDomainCode
    if (!GC_DOMAINS.includes(domain)) continue
    const normalized = normalizeItem(value, 0, 4, true)
    if (!data[domain]) data[domain] = []
    data[domain].push({ value: normalized, instrument: 'gc_sdoh30' })
  }
  return data
}

/** Route any instrument's subscores to the domain model. */
export function mapInstrumentToDomains(
  instrument: InstrumentName,
  subscores: Record<string, number>
): DomainData {
  switch (instrument) {
    case 'ema3':
      return mapEma3ToDomains(subscores)
    case 'gc_sdoh6':
      return mapSdoh6ToDomains(subscores)
    case 'gc_sdoh30':
      return mapSdoh30ToDomains(
        Object.entries(subscores).map(([questionId, value]) => ({ questionId, value }))
      )
    default:
      return {}
  }
}

/** Merge multiple DomainData sources, concatenating data points per domain. */
export function mergeDomainData(...sources: DomainData[]): DomainData {
  const merged: DomainData = {}
  for (const source of sources) {
    for (const domain of GC_DOMAINS) {
      const points = source[domain]
      if (!points || points.length === 0) continue
      if (!merged[domain]) merged[domain] = []
      merged[domain]!.push(...points)
    }
  }
  return merged
}

/** Compute domain scores (0-100) from merged domain data by averaging data points. */
export function computeDomainScores(data: DomainData): DomainScores {
  const scores: DomainScores = {}
  for (const domain of GC_DOMAINS) {
    const points = data[domain]
    if (!points || points.length === 0) continue
    const avg = points.reduce((sum, p) => sum + p.value, 0) / points.length
    scores[domain] = Math.round(avg * 100)
  }
  return scores
}

export const GC_DOMAIN_FLAG_THRESHOLD = 40

/** Identify GC-SDOH-6 domains eligible for deeper assessment. */
export function flaggedDomains(domainScores: DomainScores): GCDomainCode[] {
  return GC_DOMAINS.filter(domain => {
    const score = domainScores[domain]
    return score !== undefined && score < GC_DOMAIN_FLAG_THRESHOLD
  })
}

export interface GiveCareScoreResult {
  score: number
  band: Band
  confidence: ConfidenceLevel
  instruments: string[]
  domains: DomainScores
  supports: Array<{ domain: GCDomainCode; label: string; score: number }>
  pressures: Array<{ domain: GCDomainCode; label: string; score: number }>
  topPressure: { domain: GCDomainCode; label: string; score: number } | null
}

export function computeGiveCareScore(
  domains: DomainScores,
  instruments: string[]
): GiveCareScoreResult {
  let weightedSum = 0
  let totalWeight = 0

  for (const domain of GC_DOMAINS) {
    const domainScore = domains[domain]
    if (domainScore === undefined) continue
    weightedSum += domainScore * GC_DOMAIN_WEIGHTS[domain]
    totalWeight += GC_DOMAIN_WEIGHTS[domain]
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  const band = toBand(score)
  const confidence = getConfidence(instruments)

  const supports: GiveCareScoreResult['supports'] = []
  const pressures: GiveCareScoreResult['pressures'] = []

  for (const domain of GC_DOMAINS) {
    const domainScore = domains[domain]
    if (domainScore === undefined) continue
    const entry = { domain, label: GC_DOMAIN_LABELS[domain], score: domainScore }
    if (domainScore >= 50) {
      supports.push(entry)
    } else {
      pressures.push(entry)
    }
  }

  pressures.sort((a, b) => a.score - b.score)
  supports.sort((a, b) => b.score - a.score)

  return {
    score,
    band,
    confidence,
    instruments,
    domains,
    supports,
    pressures,
    topPressure: pressures.length > 0 ? pressures[0] : null,
  }
}

export interface InstrumentResult {
  instrument: InstrumentName
  subscores: Record<string, number>
}

/**
 * Current GiveCare Score. GC-SDOH-6 supplies the six-domain base, completed
 * GC-SDOH-30 items refine their matching domains, and EMA-3 updates the health
 * and emotional-wellbeing domains once a structural baseline exists.
 */
export function computeGiveCareScoreFromInstruments(
  instrumentResults: InstrumentResult[]
): GiveCareScoreResult {
  const baseSources: DomainData[] = []
  const deepDiveSources: DomainData[] = []
  const momentarySources: DomainData[] = []
  const instruments: string[] = []

  for (const result of instrumentResults) {
    const domainData = mapInstrumentToDomains(result.instrument, result.subscores)
    if (Object.keys(domainData).length === 0) continue
    if (result.instrument === 'gc_sdoh6') baseSources.push(domainData)
    if (result.instrument === 'gc_sdoh30') deepDiveSources.push(domainData)
    if (result.instrument === 'ema3') momentarySources.push(domainData)
    if (result.instrument !== 'ema3' && !instruments.includes(result.instrument)) {
      instruments.push(result.instrument)
    }
  }

  const merged = mergeDomainData(
    ...baseSources,
    ...(baseSources.length > 0 ? momentarySources : []),
  )
  const deepDive = mergeDomainData(...deepDiveSources)
  for (const domain of GC_DOMAINS) {
    const refinement = deepDive[domain]
    if (refinement?.length) merged[domain] = [...(merged[domain] ?? []), ...refinement]
  }
  if (baseSources.length > 0 && momentarySources.length > 0) instruments.push('ema3')
  return computeGiveCareScore(computeDomainScores(merged), instruments)
}

export interface EmaReadingResult {
  score: number
  band: Band
}

/** Native EMA-3 reading, retained alongside any baseline-anchored composite. */
export function computeEmaReading(answers: Record<string, number>): EmaReadingResult {
  const values = [
    answers.stress === undefined ? undefined : normalizeItem(answers.stress, 0, 4, true),
    answers.mood === undefined ? undefined : normalizeItem(answers.mood, 0, 4, false),
    answers.coping === undefined ? undefined : normalizeItem(answers.coping, 0, 4, false),
  ].filter((value): value is number => value !== undefined)
  const score = values.length === 0 ? 0 : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100)
  const band = toBand(score)
  return { score, band }
}

export type TrendDirection = 'improving' | 'stable' | 'declining'

export interface ScoreTrend {
  delta7d?: number
  delta30d?: number
  direction: TrendDirection
}

const MS_PER_DAY = days(1)

function historyWithinDays(
  history: Array<{ score: number; computedAt: number }>,
  effectiveNow: number,
  daysBack: number
): Array<{ score: number; computedAt: number }> {
  const cutoff = effectiveNow - daysBack * MS_PER_DAY
  return history
    .filter(entry => entry.computedAt >= cutoff && entry.computedAt <= effectiveNow)
    .sort((a, b) => a.computedAt - b.computedAt)
}

export function computeScoreTrend(
  current: number,
  history: Array<{ score: number; computedAt: number }>,
  now?: number
): ScoreTrend {
  const effectiveNow = now ?? Date.now()

  const within7d = historyWithinDays(history, effectiveNow, 7)
  const within30d = historyWithinDays(history, effectiveNow, 30)

  const delta7d = within7d.length > 0 ? current - within7d[0].score : undefined
  const delta30d = within30d.length > 0 ? current - within30d[0].score : undefined

  const recentDelta = delta7d ?? delta30d ?? 0
  const direction: TrendDirection =
    recentDelta >= 5 ? 'improving' : recentDelta <= -5 ? 'declining' : 'stable'

  return { delta7d, delta30d, direction }
}

export interface Spike {
  magnitude: number
  direction: 'improvement' | 'decline'
  severity: 'sharp' | 'notable'
}

export function detectSpike(
  current: number,
  history: Array<{ score: number; computedAt: number }>,
  now?: number
): Spike | null {
  const effectiveNow = now ?? Date.now()
  const recent = historyWithinDays(history, effectiveNow, 7)

  if (recent.length === 0) return null

  const oldest = recent[0].score
  const swing = current - oldest

  if (Math.abs(swing) >= 20) {
    return {
      magnitude: Math.abs(swing),
      direction: swing > 0 ? 'improvement' : 'decline',
      severity: Math.abs(swing) >= 30 ? 'sharp' : 'notable',
    }
  }
  return null
}
