import { describe, it, expect } from 'vitest'
import {
  getInstrument,
  listInstruments,
  scoreInstrument,
  getSdoh30QuestionsForDomains,
  getSdoh30NextChunk,
  SDOH30_QUESTIONS,
  SDOH30_ITEM_IDS,
} from '../assessments/instruments.js'

// ---------------------------------------------------------------------------
// getInstrument
// ---------------------------------------------------------------------------
describe('getInstrument', () => {
  it('returns SDOH-6 definition', () => {
    const sdoh6 = getInstrument('gc_sdoh6')
    expect(sdoh6.instrument).toBe('gc_sdoh6')
    expect(sdoh6.questions).toHaveLength(6)
    for (const q of sdoh6.questions) {
      expect(q.min).toBe(0)
      expect(q.max).toBe(4)
    }
  })

  it('returns EMA-3 definition', () => {
    const ema3 = getInstrument('ema3')
    expect(ema3.instrument).toBe('ema3')
    expect(ema3.questions).toHaveLength(3)
  })

  it('returns SDOH-30 definition', () => {
    const sdoh30 = getInstrument('gc_sdoh30')
    expect(sdoh30.instrument).toBe('gc_sdoh30')
    expect(sdoh30.questions).toHaveLength(30)
  })

  it('throws on unsupported version', () => {
    expect(() => getInstrument('gc_sdoh6', 'v99')).toThrow('Unsupported instrument version')
  })

  it('returns immutable canonical definitions', () => {
    const sdoh6 = getInstrument('gc_sdoh6')
    expect(Object.isFrozen(sdoh6)).toBe(true)
    expect(Object.isFrozen(sdoh6.questions)).toBe(true)
    expect(Object.isFrozen(sdoh6.questions[0])).toBe(true)

    const mutableSdoh6 = sdoh6 as unknown as { questions: Array<{ max: number }> }
    expect(() => {
      mutableSdoh6.questions[0].max = 100
    }).toThrow()

    const result = scoreInstrument('gc_sdoh6', 'v2', {
      financial: 4, social: 0, health: 0,
      housing: 0, navigation: 0, burnout: 0,
    })
    expect(result.maxScore).toBe(24)
  })
})

// ---------------------------------------------------------------------------
// listInstruments
// ---------------------------------------------------------------------------
describe('listInstruments', () => {
  it('returns all three instruments', () => {
    const instruments = listInstruments()
    expect(instruments).toHaveLength(3)
    const names = instruments.map(i => i.instrument)
    expect(names).toEqual(['gc_sdoh6', 'ema3', 'gc_sdoh30'])
  })
})

// ---------------------------------------------------------------------------
// scoreInstrument — SDOH-6
// ---------------------------------------------------------------------------
describe('scoreInstrument — SDOH-6', () => {
  it('scores all-zero answers as low risk', () => {
    const answers = {
      financial: 0, social: 0, health: 0,
      housing: 0, navigation: 0, burnout: 0,
    }
    const result = scoreInstrument('gc_sdoh6', 'v2', answers)
    expect(result.score).toBe(0)
    expect(result.maxScore).toBe(24)
    expect(result.riskBand).toBe('low')
  })

  it('scores all-max answers as critical risk', () => {
    const answers = {
      financial: 4, social: 4, health: 4,
      housing: 4, navigation: 4, burnout: 4,
    }
    const result = scoreInstrument('gc_sdoh6', 'v2', answers)
    expect(result.score).toBe(24)
    expect(result.maxScore).toBe(24)
    expect(result.riskBand).toBe('critical')
  })

  it('computes moderate risk correctly', () => {
    // 6/24 = 0.25 → moderate (>= 0.25)
    const answers = {
      financial: 1, social: 1, health: 1,
      housing: 1, navigation: 1, burnout: 1,
    }
    const result = scoreInstrument('gc_sdoh6', 'v2', answers)
    expect(result.score).toBe(6)
    expect(result.riskBand).toBe('moderate')
  })

  it('computes high risk correctly', () => {
    // 12/24 = 0.5 → high (>= 0.5)
    const answers = {
      financial: 2, social: 2, health: 2,
      housing: 2, navigation: 2, burnout: 2,
    }
    const result = scoreInstrument('gc_sdoh6', 'v2', answers)
    expect(result.score).toBe(12)
    expect(result.riskBand).toBe('high')
  })

  it('populates subscores per domain', () => {
    const answers = {
      financial: 3, social: 1, health: 2,
      housing: 0, navigation: 4, burnout: 2,
    }
    const result = scoreInstrument('gc_sdoh6', 'v2', answers)
    expect(result.subscores.financial).toBe(3)
    expect(result.subscores.social).toBe(1)
    expect(result.subscores.housing).toBe(0)
    expect(result.subscores.navigation).toBe(4)
  })

  it('clamps out-of-range answers to min/max', () => {
    const answers = {
      financial: -5, social: 10, health: 2,
      housing: 2, navigation: 2, burnout: 2,
    }
    const result = scoreInstrument('gc_sdoh6', 'v2', answers)
    // financial clamped to 0, social clamped to 4
    expect(result.subscores.financial).toBe(0)
    expect(result.subscores.social).toBe(4)
    expect(result.score).toBe(0 + 4 + 2 + 2 + 2 + 2)
  })

  it('treats missing answers as 0', () => {
    const result = scoreInstrument('gc_sdoh6', 'v2', {})
    expect(result.score).toBe(0)
    expect(result.riskBand).toBe('low')
  })

  it('treats NaN / undefined answer values as 0', () => {
    const answers = {
      financial: NaN,
      social: undefined as unknown as number,
      health: 4,
      housing: 4,
      navigation: 4,
      burnout: 4,
    }
    const result = scoreInstrument('gc_sdoh6', 'v2', answers)
    // financial=0, social=0, rest=4 each → 16
    expect(result.score).toBe(16)
  })
})

// ---------------------------------------------------------------------------
// scoreInstrument — EMA-3
// ---------------------------------------------------------------------------
describe('scoreInstrument — EMA-3', () => {
  it('scores all-zero answers', () => {
    const result = scoreInstrument('ema3', 'v2', { stress: 0, mood: 0, coping: 0 })
    expect(result.score).toBe(0)
    expect(result.maxScore).toBe(12)
    expect(result.riskBand).toBe('low')
  })

  it('scores all-max answers', () => {
    const result = scoreInstrument('ema3', 'v2', { stress: 4, mood: 4, coping: 4 })
    expect(result.score).toBe(12)
    expect(result.maxScore).toBe(12)
    expect(result.riskBand).toBe('critical')
  })

  it('produces correct subscores', () => {
    const result = scoreInstrument('ema3', 'v2', { stress: 3, mood: 1, coping: 2 })
    expect(result.subscores.stress).toBe(3)
    expect(result.subscores.mood).toBe(1)
    expect(result.subscores.coping).toBe(2)
    expect(result.score).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// scoreInstrument — SDOH-30
// ---------------------------------------------------------------------------
describe('scoreInstrument — SDOH-30', () => {
  it('scores all-zero as low risk', () => {
    const answers: Record<string, number> = {}
    for (const q of SDOH30_QUESTIONS) answers[q.id] = 0
    const result = scoreInstrument('gc_sdoh30', 'v2', answers)
    expect(result.score).toBe(0)
    expect(result.maxScore).toBe(120) // 30 * 4
    expect(result.riskBand).toBe('low')
  })

  it('scores all-max as critical risk', () => {
    const answers: Record<string, number> = {}
    for (const q of SDOH30_QUESTIONS) answers[q.id] = 4
    const result = scoreInstrument('gc_sdoh30', 'v2', answers)
    expect(result.score).toBe(120)
    expect(result.riskBand).toBe('critical')
  })

  it('aggregates subscores by domain', () => {
    const answers: Record<string, number> = {}
    for (const q of SDOH30_QUESTIONS) answers[q.id] = 0
    // Set all GC1 questions to 3
    answers['GC1-1'] = 3
    answers['GC1-2'] = 3
    answers['GC1-3'] = 3
    answers['GC1-4'] = 3
    answers['GC1-5'] = 3
    const result = scoreInstrument('gc_sdoh30', 'v2', answers)
    expect(result.subscores['GC1']).toBe(15) // 5 * 3
    expect(result.subscores['GC2']).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// SDOH-30 question structure
// ---------------------------------------------------------------------------
describe('SDOH-30 questions', () => {
  it('has exactly 30 questions', () => {
    expect(SDOH30_QUESTIONS).toHaveLength(30)
  })

  it('has 5 questions per domain', () => {
    const counts: Record<string, number> = {}
    for (const q of SDOH30_QUESTIONS) {
      counts[q.gcDomain] = (counts[q.gcDomain] ?? 0) + 1
    }
    for (const domain of ['GC1', 'GC2', 'GC3', 'GC4', 'GC5', 'GC6']) {
      expect(counts[domain]).toBe(5)
    }
  })

  it('all items use 0-4 scale', () => {
    for (const q of SDOH30_QUESTIONS) {
      expect(q.min).toBe(0)
      expect(q.max).toBe(4)
    }
  })

  it('exposes immutable canonical questions and item ids', () => {
    expect(Object.isFrozen(SDOH30_QUESTIONS)).toBe(true)
    expect(Object.isFrozen(SDOH30_QUESTIONS[0])).toBe(true)
    expect(Object.isFrozen(SDOH30_ITEM_IDS)).toBe(true)

    const mutableQuestions = SDOH30_QUESTIONS as unknown as Array<{ max: number }>
    expect(() => {
      mutableQuestions[0].max = 100
    }).toThrow()

    const mutableIds = SDOH30_ITEM_IDS as unknown as string[]
    expect(() => {
      mutableIds.push('GC9-1')
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// getSdoh30QuestionsForDomains
// ---------------------------------------------------------------------------
describe('getSdoh30QuestionsForDomains', () => {
  it('returns remaining deep-dive questions for specified domains only', () => {
    const result = getSdoh30QuestionsForDomains(['GC1', 'GC4'])
    expect(result).toHaveLength(8)
    for (const q of result) {
      expect(['GC1', 'GC4']).toContain(q.gcDomain)
    }
  })

  it('omits Quick-6 representative questions from deep-dive pools', () => {
    const result = getSdoh30QuestionsForDomains(['GC4'])
    expect(result.map(q => q.id)).toEqual(['GC4-2', 'GC4-3', 'GC4-4', 'GC4-5'])
  })

  it('returns empty array for empty domains', () => {
    expect(getSdoh30QuestionsForDomains([])).toEqual([])
  })

  it('returns 24 remaining deep-dive questions for all domains', () => {
    expect(getSdoh30QuestionsForDomains(['GC1', 'GC2', 'GC3', 'GC4', 'GC5', 'GC6'])).toHaveLength(24)
  })
})

// ---------------------------------------------------------------------------
// getSdoh30NextChunk
// ---------------------------------------------------------------------------
describe('getSdoh30NextChunk', () => {
  it('returns first chunk when nothing is completed', () => {
    const chunk = getSdoh30NextChunk([], 5)
    expect(chunk).toHaveLength(5)
    expect(chunk).toEqual(SDOH30_ITEM_IDS.slice(0, 5))
  })

  it('skips completed items', () => {
    const completed = SDOH30_ITEM_IDS.slice(0, 5)
    const chunk = getSdoh30NextChunk(completed, 5)
    expect(chunk).toEqual(SDOH30_ITEM_IDS.slice(5, 10))
  })

  it('returns fewer items when near the end', () => {
    const completed = SDOH30_ITEM_IDS.slice(0, 28)
    const chunk = getSdoh30NextChunk(completed, 5)
    expect(chunk).toHaveLength(2)
  })

  it('returns empty when all completed', () => {
    expect(getSdoh30NextChunk(SDOH30_ITEM_IDS, 5)).toEqual([])
  })
})
