import { describe, it, expect } from 'vitest'
import {
  toBand,
  getConfidence,
  mapEma3ToDomains,
  mapSdoh6ToDomains,
  mapSdoh30ToDomains,
  mapInstrumentToDomains,
  mergeDomainData,
  computeDomainScores,
  flaggedDomains,
  computeGiveCareScore,
  computeGiveCareScoreFromInstruments,
  computeEmaReading,
  computeScoreTrend,
  detectSpike,
  GC_DOMAINS,
  GC_DOMAIN_LABELS,
  GC_DOMAIN_WEIGHTS,
} from '../scoring/givecareScore.js'

// ---------------------------------------------------------------------------
// toBand
// ---------------------------------------------------------------------------
describe('toBand', () => {
  it('returns strong for score >= 75', () => {
    expect(toBand(75)).toBe('strong')
    expect(toBand(100)).toBe('strong')
  })

  it('returns steady for score 50-74', () => {
    expect(toBand(50)).toBe('steady')
    expect(toBand(74)).toBe('steady')
  })

  it('returns building for score 25-49', () => {
    expect(toBand(25)).toBe('building')
    expect(toBand(49)).toBe('building')
  })

  it('returns needs_attention for score < 25', () => {
    expect(toBand(0)).toBe('needs_attention')
    expect(toBand(24)).toBe('needs_attention')
  })
})

// ---------------------------------------------------------------------------
// getConfidence
// ---------------------------------------------------------------------------
describe('getConfidence', () => {
  it('returns early_estimate for 0 or 1 instruments', () => {
    expect(getConfidence([])).toBe('early_estimate')
    expect(getConfidence(['gc_sdoh6'])).toBe('early_estimate')
  })

  it('returns building for 2 instruments', () => {
    expect(getConfidence(['gc_sdoh6', 'ema3'])).toBe('building')
  })

  it('returns solid for 3+ instruments', () => {
    expect(getConfidence(['gc_sdoh6', 'ema3', 'gc_sdoh30'])).toBe('solid')
    expect(getConfidence(['a', 'b', 'c', 'd'])).toBe('solid')
  })
})

// ---------------------------------------------------------------------------
// Domain constants
// ---------------------------------------------------------------------------
describe('domain constants', () => {
  it('has 6 domains GC1-GC6', () => {
    expect(GC_DOMAINS).toEqual(['GC1', 'GC2', 'GC3', 'GC4', 'GC5', 'GC6'])
  })

  it('domain weights sum to 1.0', () => {
    const sum = Object.values(GC_DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0)
  })

  it('each domain has a label', () => {
    for (const z of GC_DOMAINS) {
      expect(GC_DOMAIN_LABELS[z]).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// mapEma3ToDomains
// ---------------------------------------------------------------------------
describe('mapEma3ToDomains', () => {
  it('maps stress to GC2 (inverted)', () => {
    // stress=0 → normalizeItem(0,0,4,true) = 1-0 = 1.0
    const data = mapEma3ToDomains({ stress: 0 })
    expect(data.GC2).toBeDefined()
    expect(data.GC2![0].value).toBe(1.0)
    expect(data.GC2![0].instrument).toBe('ema3')
  })

  it('maps stress=4 to GC2 as 0 (inverted)', () => {
    const data = mapEma3ToDomains({ stress: 4 })
    expect(data.GC2![0].value).toBe(0)
  })

  it('maps mood and coping to GC6 (direct)', () => {
    const data = mapEma3ToDomains({ mood: 4, coping: 4 })
    expect(data.GC6).toHaveLength(2)
    expect(data.GC6![0].value).toBe(1.0) // 4/4 direct
    expect(data.GC6![1].value).toBe(1.0)
  })

  it('maps mood=0 and coping=0 to GC6 as 0 (direct)', () => {
    const data = mapEma3ToDomains({ mood: 0, coping: 0 })
    expect(data.GC6![0].value).toBe(0)
    expect(data.GC6![1].value).toBe(0)
  })

  it('returns empty for empty subscores', () => {
    const data = mapEma3ToDomains({})
    expect(Object.keys(data)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// mapSdoh6ToDomains
// ---------------------------------------------------------------------------
describe('mapSdoh6ToDomains', () => {
  it('maps all 6 domains to correct domains (inverted/deficit-framed)', () => {
    const data = mapSdoh6ToDomains({
      social: 0, health: 0, housing: 0,
      financial: 0, navigation: 0, burnout: 0,
    })
    // 0 deficit → inverted → 1.0 (good)
    expect(data.GC1![0].value).toBe(1.0)
    expect(data.GC2![0].value).toBe(1.0)
    expect(data.GC3![0].value).toBe(1.0)
    expect(data.GC4![0].value).toBe(1.0)
    expect(data.GC5![0].value).toBe(1.0)
    expect(data.GC6![0].value).toBe(1.0)
  })

  it('max deficit maps to 0', () => {
    const data = mapSdoh6ToDomains({
      social: 4, health: 4, housing: 4,
      financial: 4, navigation: 4, burnout: 4,
    })
    for (const z of GC_DOMAINS) {
      expect(data[z]![0].value).toBe(0)
    }
  })

  it('maps partial subscores', () => {
    const data = mapSdoh6ToDomains({ social: 2 })
    expect(data.GC1).toBeDefined()
    expect(data.GC2).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// mapSdoh30ToDomains
// ---------------------------------------------------------------------------
describe('mapSdoh30ToDomains', () => {
  it('groups responses by domain prefix', () => {
    const data = mapSdoh30ToDomains([
      { questionId: 'GC1-1', value: 0 },
      { questionId: 'GC1-2', value: 2 },
      { questionId: 'GC3-1', value: 4 },
    ])
    expect(data.GC1).toHaveLength(2)
    expect(data.GC3).toHaveLength(1)
    expect(data.GC2).toBeUndefined()
  })

  it('inverts deficit-framed values', () => {
    const data = mapSdoh30ToDomains([{ questionId: 'GC1-1', value: 0 }])
    // 0 deficit → 1.0 wellbeing
    expect(data.GC1![0].value).toBe(1.0)
  })

  it('skips invalid domain prefixes', () => {
    const data = mapSdoh30ToDomains([{ questionId: 'XX-1', value: 2 }])
    expect(Object.keys(data)).toHaveLength(0)
  })

  it('returns empty for empty input', () => {
    const data = mapSdoh30ToDomains([])
    expect(Object.keys(data)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// mapInstrumentToDomains (router)
// ---------------------------------------------------------------------------
describe('mapInstrumentToDomains', () => {
  it('routes ema3', () => {
    const data = mapInstrumentToDomains('ema3', { stress: 2 })
    expect(data.GC2).toBeDefined()
  })

  it('routes sdoh6', () => {
    const data = mapInstrumentToDomains('gc_sdoh6', { social: 1 })
    expect(data.GC1).toBeDefined()
  })

  it('routes sdoh30 by converting subscores to responses', () => {
    const data = mapInstrumentToDomains('gc_sdoh30', { 'GC4-1': 3 })
    expect(data.GC4).toBeDefined()
  })

  it('returns empty for unknown instrument', () => {
    const data = mapInstrumentToDomains('unknown' as any, {})
    expect(Object.keys(data)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// mergeDomainData
// ---------------------------------------------------------------------------
describe('mergeDomainData', () => {
  it('merges data from two sources', () => {
    const a = { GC1: [{ value: 0.8, instrument: 'gc_sdoh6' }] }
    const b = { GC1: [{ value: 0.6, instrument: 'ema3' }], GC2: [{ value: 0.5, instrument: 'ema3' }] }
    const merged = mergeDomainData(a, b)
    expect(merged.GC1).toHaveLength(2)
    expect(merged.GC2).toHaveLength(1)
  })

  it('handles empty sources', () => {
    const merged = mergeDomainData({}, {})
    expect(Object.keys(merged)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// computeDomainScores
// ---------------------------------------------------------------------------
describe('computeDomainScores', () => {
  it('averages data points and scales to 0-100', () => {
    const data = {
      GC1: [{ value: 0.8, instrument: 'a' }, { value: 0.6, instrument: 'b' }],
    }
    const scores = computeDomainScores(data)
    expect(scores.GC1).toBe(70) // Math.round(0.7 * 100)
  })

  it('returns empty for no data', () => {
    expect(Object.keys(computeDomainScores({}))).toHaveLength(0)
  })

  it('handles single data point', () => {
    const scores = computeDomainScores({
      GC3: [{ value: 1.0, instrument: 'x' }],
    })
    expect(scores.GC3).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// flaggedDomains
// ---------------------------------------------------------------------------
describe('flaggedDomains', () => {
  it('flags domains below threshold (40)', () => {
    const flagged = flaggedDomains({ GC1: 80, GC2: 30, GC3: 39 })
    expect(flagged).toContain('GC2')
    expect(flagged).toContain('GC3')
    expect(flagged).not.toContain('GC1')
  })

  it('does not flag domains at exactly 40', () => {
    const flagged = flaggedDomains({ GC1: 40 })
    expect(flagged).not.toContain('GC1')
  })

  it('returns empty when all domains are strong', () => {
    const flagged = flaggedDomains({ GC1: 90, GC2: 80, GC3: 70, GC4: 60, GC5: 50, GC6: 40 })
    expect(flagged).toHaveLength(0)
  })

  it('returns empty for empty domain scores', () => {
    expect(flaggedDomains({})).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// computeGiveCareScore
// ---------------------------------------------------------------------------
describe('computeGiveCareScore', () => {
  it('computes weighted score', () => {
    // All domains at 80 → weighted average = 80
    const domains = { GC1: 80, GC2: 80, GC3: 80, GC4: 80, GC5: 80, GC6: 80 }
    const result = computeGiveCareScore(domains, ['gc_sdoh6'])
    expect(result.score).toBe(80)
    expect(result.band).toBe('strong')
    expect(result.confidence).toBe('early_estimate')
  })

  it('returns 0 when no domains have data', () => {
    const result = computeGiveCareScore({}, [])
    expect(result.score).toBe(0)
  })

  it('separates supports and pressures correctly', () => {
    const domains = { GC1: 70, GC2: 30, GC3: 10, GC4: 90 }
    const result = computeGiveCareScore(domains, ['gc_sdoh6', 'ema3'])
    expect(result.supports.map(s => s.domain)).toEqual(expect.arrayContaining(['GC1', 'GC4']))
    expect(result.pressures.map(p => p.domain)).toEqual(expect.arrayContaining(['GC2', 'GC3']))
    // pressures sorted ascending
    expect(result.pressures[0].score).toBeLessThanOrEqual(result.pressures[1].score)
    // topPressure is the worst
    expect(result.topPressure!.domain).toBe('GC3')
  })

  it('topPressure is null when no pressures', () => {
    const result = computeGiveCareScore({ GC1: 80 }, [])
    expect(result.topPressure).toBeNull()
  })

  it('reflects correct confidence level', () => {
    const domains = { GC1: 50 }
    expect(computeGiveCareScore(domains, ['gc_sdoh6', 'ema3', 'gc_sdoh30']).confidence).toBe('solid')
    expect(computeGiveCareScore(domains, ['gc_sdoh6', 'ema3']).confidence).toBe('building')
    expect(computeGiveCareScore(domains, ['gc_sdoh6']).confidence).toBe('early_estimate')
  })
})

// ---------------------------------------------------------------------------
// computeGiveCareScoreFromInstruments (full pipeline)
// ---------------------------------------------------------------------------
describe('computeGiveCareScoreFromInstruments', () => {
  it('produces a score from SDOH-6 results', () => {
    const result = computeGiveCareScoreFromInstruments([
      {
        instrument: 'gc_sdoh6',
        subscores: {
          social: 0, health: 0, housing: 0,
          financial: 0, navigation: 0, burnout: 0,
        },
      },
    ])
    // All 0 deficit → all domains = 100
    expect(result.score).toBe(100)
    expect(result.band).toBe('strong')
    expect(result.instruments).toEqual(['gc_sdoh6'])
  })

  it('lets EMA-3 update the current GiveCare Score without replacing the structural baseline', () => {
    const result = computeGiveCareScoreFromInstruments([
      {
        instrument: 'gc_sdoh6',
        subscores: {
          social: 2, health: 2, housing: 2,
          financial: 2, navigation: 2, burnout: 2,
        },
      },
      {
        instrument: 'ema3',
        subscores: { stress: 0, mood: 4, coping: 4 },
      },
    ])
    expect(result.instruments).toEqual(['gc_sdoh6', 'ema3'])
    expect(result.confidence).toBe('building')
    expect(result.domains.GC2).toBe(75)
    expect(result.domains.GC6).toBe(83)
    expect(result.score).toBe(62)
  })

  it('keeps EMA-3 as a standalone reading until a structural baseline exists', () => {
    const result = computeGiveCareScoreFromInstruments([
      {
        instrument: 'ema3',
        subscores: { stress: 0, mood: 4, coping: 4 },
      },
    ])
    expect(result.instruments).toEqual([])
    expect(result.score).toBe(0)
  })

  it('uses targeted SDOH-30 answers to refine one matching domain', () => {
    const result = computeGiveCareScoreFromInstruments([
      {
        instrument: 'gc_sdoh6',
        subscores: {
          social: 2, health: 2, housing: 2,
          financial: 2, navigation: 2, burnout: 2,
        },
      },
      {
        instrument: 'gc_sdoh30',
        subscores: { 'GC4-2': 4, 'GC4-3': 4, 'GC4-4': 4, 'GC4-5': 4 },
      },
    ])
    expect(result.instruments).toEqual(['gc_sdoh6', 'gc_sdoh30'])
    expect(result.domains.GC4).toBe(10)
    expect(result.score).toBe(42)
  })

  it('handles empty instrument list', () => {
    const result = computeGiveCareScoreFromInstruments([])
    expect(result.score).toBe(0)
    expect(result.instruments).toEqual([])
  })
})

describe('computeEmaReading', () => {
  it('normalizes stress, mood, and coping into a separate reading', () => {
    expect(computeEmaReading({ stress: 2, mood: 2, coping: 2 }).score).toBe(50)
    expect(computeEmaReading({ stress: 0, mood: 4, coping: 4 }).score).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// computeScoreTrend
// ---------------------------------------------------------------------------
describe('computeScoreTrend', () => {
  const DAY = 24 * 60 * 60 * 1000
  const NOW = 1_700_000_000_000

  it('returns stable when no history', () => {
    const trend = computeScoreTrend(50, [], NOW)
    expect(trend.direction).toBe('stable')
    expect(trend.delta7d).toBeUndefined()
    expect(trend.delta30d).toBeUndefined()
  })

  it('detects improving trend (delta >= 5)', () => {
    const history = [{ score: 40, computedAt: NOW - 3 * DAY }]
    const trend = computeScoreTrend(50, history, NOW)
    expect(trend.delta7d).toBe(10)
    expect(trend.direction).toBe('improving')
  })

  it('detects declining trend (delta <= -5)', () => {
    const history = [{ score: 60, computedAt: NOW - 3 * DAY }]
    const trend = computeScoreTrend(50, history, NOW)
    expect(trend.delta7d).toBe(-10)
    expect(trend.direction).toBe('declining')
  })

  it('detects stable trend (small delta)', () => {
    const history = [{ score: 48, computedAt: NOW - 3 * DAY }]
    const trend = computeScoreTrend(50, history, NOW)
    expect(trend.delta7d).toBe(2)
    expect(trend.direction).toBe('stable')
  })

  it('uses oldest entry within 7d for delta7d', () => {
    const history = [
      { score: 30, computedAt: NOW - 6 * DAY }, // oldest within 7d
      { score: 40, computedAt: NOW - 2 * DAY },
    ]
    const trend = computeScoreTrend(50, history, NOW)
    expect(trend.delta7d).toBe(20) // 50 - 30
  })

  it('computes delta30d from older entries', () => {
    const history = [
      { score: 20, computedAt: NOW - 20 * DAY },
    ]
    const trend = computeScoreTrend(50, history, NOW)
    expect(trend.delta7d).toBeUndefined() // > 7d ago
    expect(trend.delta30d).toBe(30)
    expect(trend.direction).toBe('improving') // falls back to delta30d
  })

  it('ignores future-dated entries', () => {
    const history = [
      { score: 90, computedAt: NOW + DAY },
      { score: 40, computedAt: NOW - 3 * DAY },
    ]
    const trend = computeScoreTrend(50, history, NOW)
    expect(trend.delta7d).toBe(10)
    expect(trend.delta30d).toBe(10)
    expect(trend.direction).toBe('improving')
  })

  it('returns stable when history is only future-dated', () => {
    const history = [{ score: 90, computedAt: NOW + DAY }]
    const trend = computeScoreTrend(50, history, NOW)
    expect(trend.delta7d).toBeUndefined()
    expect(trend.delta30d).toBeUndefined()
    expect(trend.direction).toBe('stable')
  })
})

// ---------------------------------------------------------------------------
// detectSpike
// ---------------------------------------------------------------------------
describe('detectSpike', () => {
  const DAY = 24 * 60 * 60 * 1000
  const NOW = 1_700_000_000_000

  it('returns null when no recent history', () => {
    expect(detectSpike(50, [], NOW)).toBeNull()
  })

  it('returns null when history is older than 7 days', () => {
    const history = [{ score: 20, computedAt: NOW - 10 * DAY }]
    expect(detectSpike(50, history, NOW)).toBeNull()
  })

  it('detects notable improvement (swing 20-29)', () => {
    const history = [{ score: 30, computedAt: NOW - 3 * DAY }]
    const spike = detectSpike(50, history, NOW)
    expect(spike).not.toBeNull()
    expect(spike!.direction).toBe('improvement')
    expect(spike!.severity).toBe('notable')
    expect(spike!.magnitude).toBe(20)
  })

  it('detects sharp improvement (swing >= 30)', () => {
    const history = [{ score: 20, computedAt: NOW - 3 * DAY }]
    const spike = detectSpike(50, history, NOW)
    expect(spike!.direction).toBe('improvement')
    expect(spike!.severity).toBe('sharp')
    expect(spike!.magnitude).toBe(30)
  })

  it('detects notable decline', () => {
    const history = [{ score: 70, computedAt: NOW - 3 * DAY }]
    const spike = detectSpike(50, history, NOW)
    expect(spike!.direction).toBe('decline')
    expect(spike!.severity).toBe('notable')
  })

  it('detects sharp decline', () => {
    const history = [{ score: 80, computedAt: NOW - 3 * DAY }]
    const spike = detectSpike(50, history, NOW)
    expect(spike!.direction).toBe('decline')
    expect(spike!.severity).toBe('sharp')
  })

  it('returns null for small swings (< 20)', () => {
    const history = [{ score: 40, computedAt: NOW - 3 * DAY }]
    expect(detectSpike(50, history, NOW)).toBeNull()
  })

  it('ignores future-dated entries', () => {
    const history = [
      { score: 90, computedAt: NOW + DAY },
      { score: 30, computedAt: NOW - 3 * DAY },
    ]
    const spike = detectSpike(50, history, NOW)
    expect(spike).not.toBeNull()
    expect(spike!.direction).toBe('improvement')
    expect(spike!.magnitude).toBe(20)
  })

  it('returns null when recent history is only future-dated', () => {
    const history = [{ score: 90, computedAt: NOW + DAY }]
    expect(detectSpike(50, history, NOW)).toBeNull()
  })
})
