export type InstrumentName = 'gc_sdoh6' | 'ema3' | 'gc_sdoh30'

export type GCDomainCode = 'GC1' | 'GC2' | 'GC3' | 'GC4' | 'GC5' | 'GC6'

export interface AssessmentQuestion {
  readonly id: string
  readonly prompt: string
  readonly min: number
  readonly max: number
  readonly domain: string
}

export interface AssessmentInstrument {
  readonly instrument: InstrumentName
  readonly version: string
  readonly title: string
  readonly questions: readonly AssessmentQuestion[]
}

export interface AssessmentScore {
  score: number
  maxScore: number
  subscores: Record<string, number>
  /**
   * Routing grouping for the raw deficit total, from `toRiskBand`. Intended
   * for operator routing, not a validated cutoff and not a validated clinical
   * interpretation. GC-SDOH instruments record self-reported caregiver needs;
   * they are not validated burden or well-being instruments, so no band here
   * carries an instrument-level claim.
   */
  riskBand: 'low' | 'moderate' | 'high' | 'critical'
}

export interface Sdoh30Question {
  readonly id: string
  readonly prompt: string
  readonly min: number
  readonly max: number
  readonly gcDomain: GCDomainCode
}

function freezeItems<T extends object>(items: readonly T[]): readonly Readonly<T>[] {
  return Object.freeze(items.map(item => Object.freeze({ ...item })))
}

function freezeInstrument(instrument: AssessmentInstrument): AssessmentInstrument {
  return Object.freeze({
    ...instrument,
    questions: freezeItems(instrument.questions),
  })
}

// GC-SDOH-6: six-domain structural baseline.
const SDOH6: AssessmentInstrument = freezeInstrument({
  instrument: 'gc_sdoh6',
  version: 'v2',
  title: 'GC-SDOH-6',
  questions: [
    {
      id: 'financial',
      prompt: 'How much financial strain is caregiving causing?',
      min: 0,
      max: 4,
      domain: 'financial',
    },
    {
      id: 'social',
      prompt: 'How often do you feel alone in caregiving?',
      min: 0,
      max: 4,
      domain: 'social',
    },
    {
      id: 'health',
      prompt: 'How much has your own health worsened?',
      min: 0,
      max: 4,
      domain: 'health',
    },
    {
      id: 'housing',
      prompt: 'How unstable does your home situation feel?',
      min: 0,
      max: 4,
      domain: 'housing',
    },
    {
      id: 'navigation',
      prompt: 'How hard is it to navigate care systems right now?',
      min: 0,
      max: 4,
      domain: 'navigation',
    },
    {
      id: 'burnout',
      prompt: 'How overwhelmed do you feel today?',
      min: 0,
      max: 4,
      domain: 'burnout',
    },
  ],
})

// EMA-3: Daily wellbeing micro-check
const EMA3: AssessmentInstrument = freezeInstrument({
  instrument: 'ema3',
  version: 'v2',
  title: 'Daily wellbeing micro-check',
  questions: [
    {
      id: 'stress',
      prompt: 'How stressed do you feel right now? (0=none, 4=extreme)',
      min: 0,
      max: 4,
      domain: 'stress',
    },
    {
      id: 'mood',
      prompt: 'How would you rate your mood right now? (0=very low, 4=great)',
      min: 0,
      max: 4,
      domain: 'mood',
    },
    {
      id: 'coping',
      prompt: 'How well are you coping today? (0=not at all, 4=very well)',
      min: 0,
      max: 4,
      domain: 'coping',
    },
  ],
})

// GC-SDOH-30: 30-item bank, administered as four additional questions in one
// domain flagged by GC-SDOH-6.
export const SDOH30_QUESTIONS: readonly Sdoh30Question[] = freezeItems([
  // GC1: Social Support
  {
    id: 'GC1-1',
    prompt: 'How often do you feel you have no one to talk to about caregiving?',
    min: 0,
    max: 4,
    gcDomain: 'GC1',
  },
  {
    id: 'GC1-2',
    prompt: 'How hard is it to find someone to step in when you need a break?',
    min: 0,
    max: 4,
    gcDomain: 'GC1',
  },
  {
    id: 'GC1-3',
    prompt: 'How often do you feel isolated because of your caregiving role?',
    min: 0,
    max: 4,
    gcDomain: 'GC1',
  },
  {
    id: 'GC1-4',
    prompt: 'How difficult is it to ask family or friends for help?',
    min: 0,
    max: 4,
    gcDomain: 'GC1',
  },
  {
    id: 'GC1-5',
    prompt: 'How often do you feel you handle everything alone?',
    min: 0,
    max: 4,
    gcDomain: 'GC1',
  },

  // GC2: Physical Health
  {
    id: 'GC2-1',
    prompt: 'How much has caregiving worsened your physical health?',
    min: 0,
    max: 4,
    gcDomain: 'GC2',
  },
  {
    id: 'GC2-2',
    prompt: 'How often are you too exhausted to take care of yourself?',
    min: 0,
    max: 4,
    gcDomain: 'GC2',
  },
  {
    id: 'GC2-3',
    prompt: 'How hard is it to get enough sleep because of caregiving?',
    min: 0,
    max: 4,
    gcDomain: 'GC2',
  },
  {
    id: 'GC2-4',
    prompt: 'How often do you skip your own medical appointments?',
    min: 0,
    max: 4,
    gcDomain: 'GC2',
  },
  {
    id: 'GC2-5',
    prompt: 'How much does caregiving interfere with eating well or exercising?',
    min: 0,
    max: 4,
    gcDomain: 'GC2',
  },

  // GC3: Housing & Environment
  {
    id: 'GC3-1',
    prompt: 'How unstable does your living situation feel right now?',
    min: 0,
    max: 4,
    gcDomain: 'GC3',
  },
  {
    id: 'GC3-2',
    prompt: 'How hard is it to keep up with home repairs or maintenance?',
    min: 0,
    max: 4,
    gcDomain: 'GC3',
  },
  {
    id: 'GC3-3',
    prompt: 'How often do safety or accessibility issues at home affect caregiving?',
    min: 0,
    max: 4,
    gcDomain: 'GC3',
  },
  {
    id: 'GC3-4',
    prompt: 'How difficult is it to get reliable transportation for care needs?',
    min: 0,
    max: 4,
    gcDomain: 'GC3',
  },
  {
    id: 'GC3-5',
    prompt: 'How much does your neighborhood lack services you need?',
    min: 0,
    max: 4,
    gcDomain: 'GC3',
  },

  // GC4: Financial Resources
  {
    id: 'GC4-1',
    prompt: 'How much financial strain is caregiving causing you?',
    min: 0,
    max: 4,
    gcDomain: 'GC4',
  },
  {
    id: 'GC4-2',
    prompt: 'How often do costs prevent you from getting needed care help?',
    min: 0,
    max: 4,
    gcDomain: 'GC4',
  },
  {
    id: 'GC4-3',
    prompt: 'How hard is it to find affordable caregiving support?',
    min: 0,
    max: 4,
    gcDomain: 'GC4',
  },
  {
    id: 'GC4-4',
    prompt: 'How much has caregiving reduced your income or work hours?',
    min: 0,
    max: 4,
    gcDomain: 'GC4',
  },
  {
    id: 'GC4-5',
    prompt: 'How worried are you about long-term financial security?',
    min: 0,
    max: 4,
    gcDomain: 'GC4',
  },

  // GC5: Navigation
  {
    id: 'GC5-1',
    prompt: 'How hard is it to understand or navigate care system options?',
    min: 0,
    max: 4,
    gcDomain: 'GC5',
  },
  {
    id: 'GC5-2',
    prompt: 'How often do confusing rules or paperwork slow you down?',
    min: 0,
    max: 4,
    gcDomain: 'GC5',
  },
  {
    id: 'GC5-3',
    prompt: 'How difficult is it to find trustworthy information about benefits?',
    min: 0,
    max: 4,
    gcDomain: 'GC5',
  },
  {
    id: 'GC5-4',
    prompt: 'How hard is it to deal with legal, insurance, or government forms?',
    min: 0,
    max: 4,
    gcDomain: 'GC5',
  },
  {
    id: 'GC5-5',
    prompt: 'How often do you feel lost trying to coordinate between providers?',
    min: 0,
    max: 4,
    gcDomain: 'GC5',
  },

  // GC6: Emotional Wellbeing
  {
    id: 'GC6-1',
    prompt: 'How overwhelmed do you feel by your caregiving responsibilities?',
    min: 0,
    max: 4,
    gcDomain: 'GC6',
  },
  {
    id: 'GC6-2',
    prompt: 'How often do you feel anxious or worried about the future?',
    min: 0,
    max: 4,
    gcDomain: 'GC6',
  },
  {
    id: 'GC6-3',
    prompt: 'How hard is it to find time for things that bring you joy?',
    min: 0,
    max: 4,
    gcDomain: 'GC6',
  },
  {
    id: 'GC6-4',
    prompt: 'How often do you feel guilty about how you handle caregiving?',
    min: 0,
    max: 4,
    gcDomain: 'GC6',
  },
  {
    id: 'GC6-5',
    prompt: 'How much has caregiving affected your sense of who you are?',
    min: 0,
    max: 4,
    gcDomain: 'GC6',
  },
])

const SDOH30: AssessmentInstrument = freezeInstrument({
  instrument: 'gc_sdoh30',
  version: 'v2',
  title: 'GC-SDOH-30',
  questions: SDOH30_QUESTIONS.map(({ id, prompt, min, max, gcDomain }) => ({
    id,
    prompt,
    min,
    max,
    domain: gcDomain,
  })),
})

const INSTRUMENTS: Readonly<Record<InstrumentName, AssessmentInstrument>> = Object.freeze({
  gc_sdoh6: SDOH6,
  ema3: EMA3,
  gc_sdoh30: SDOH30,
})

export function getInstrument(instrument: InstrumentName, version = 'v2'): AssessmentInstrument {
  const candidate = INSTRUMENTS[instrument]
  if (!candidate || candidate.version !== version) {
    throw new Error(`Unsupported instrument version: ${instrument}/${version}`)
  }
  return candidate
}

export function listInstruments(): AssessmentInstrument[] {
  return [SDOH6, EMA3, SDOH30]
}

export function scoreInstrument(
  instrument: InstrumentName,
  version: string,
  answers: Record<string, number>
): AssessmentScore {
  const definition = getInstrument(instrument, version)
  const subscores: Record<string, number> = {}
  let total = 0
  let maxScore = 0

  for (const question of definition.questions) {
    const raw = answers[question.id]
    const value = clamp(Number.isFinite(raw) ? raw : 0, question.min, question.max)
    total += value
    maxScore += question.max
    subscores[question.domain] = (subscores[question.domain] ?? 0) + value
  }

  return {
    score: total,
    maxScore,
    subscores,
    riskBand: toRiskBand(total, maxScore),
  }
}

/** Get the four additional GC-SDOH-30 questions for selected caregiver domains. */
export function getSdoh30QuestionsForDomains(domains: readonly GCDomainCode[]): Sdoh30Question[] {
  const domainSet = new Set(domains)
  return SDOH30_QUESTIONS.filter(
    q => domainSet.has(q.gcDomain) && q.id !== QUICK6_SDOH30_REPRESENTATIVE_IDS[q.gcDomain]
  )
}

const QUICK6_SDOH30_REPRESENTATIVE_IDS: Readonly<Record<GCDomainCode, string>> = Object.freeze({
  GC1: 'GC1-1',
  GC2: 'GC2-1',
  GC3: 'GC3-1',
  GC4: 'GC4-1',
  GC5: 'GC5-1',
  GC6: 'GC6-1',
})

/** All SDOH-30 item IDs in definition order. */
export const SDOH30_ITEM_IDS: readonly string[] = Object.freeze(SDOH30_QUESTIONS.map(q => q.id))

/** Get the next chunk of SDOH-30 items not yet completed. */
export function getSdoh30NextChunk(completedItemIds: readonly string[], chunkSize: number): string[] {
  const completed = new Set(completedItemIds)
  return SDOH30_ITEM_IDS.filter(id => !completed.has(id)).slice(0, chunkSize)
}

/**
 * Group the raw deficit total by proportion of the instrument maximum:
 * <25% low, <50% moderate, <75% high, otherwise critical. Structural
 * quartiles for routing, not validated cutoffs. Distinct from the composite
 * `toBand` in ../scoring/givecareScore.ts, which groups the 0-100 GiveCare
 * Score on the opposite polarity.
 */
function toRiskBand(score: number, maxScore: number): 'low' | 'moderate' | 'high' | 'critical' {
  const ratio = maxScore > 0 ? score / maxScore : 0
  if (ratio < 0.25) return 'low'
  if (ratio < 0.5) return 'moderate'
  if (ratio < 0.75) return 'high'
  return 'critical'
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return Math.round(value)
}
