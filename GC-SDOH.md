# GC-SDOH-30: GiveCare Social Determinants of Health Assessment

## Overview

GC-SDOH-30 is a 30-question item bank designed to identify social determinants of health affecting caregivers and care recipients. All questions use a consistent 0-4 deficit-framed scale (higher = greater need) across six priority domains with 5 questions each.

It is informed by PRAPARE and AHC-HRSN methodology. The runtime administers four additional questions in one flagged domain, not the full 30-question bank.

## Assessment Time

- **GC-SDOH-6:** ~2 minutes (1 question per domain)
- **GC-SDOH-30 branch:** ~1-2 minutes (4 additional questions in one flagged domain)

## Priority Domains

| Domain | Label | Questions |
|------|-------|-----------|
| GC1 | Social Support | 5 (16.7%) |
| GC2 | Physical Health | 5 (16.7%) |
| GC3 | Housing & Environment | 5 (16.7%) |
| GC4 | Financial Resources | 5 (16.7%) |
| GC5 | Navigation | 5 (16.7%) |
| GC6 | Emotional Wellbeing | 5 (16.7%) |

## Instruments

### GC-SDOH-6: Six-Domain Snapshot

Quick screening with one question per domain. Used at baseline and about every 30 days.

| ID | Domain | Prompt |
|----|--------|--------|
| financial | GC4 | How much financial strain is caregiving causing? |
| social | GC1 | How often do you feel alone in caregiving? |
| health | GC2 | How much has your own health worsened? |
| housing | GC3 | How unstable does your home situation feel? |
| navigation | GC5 | How hard is it to navigate care systems right now? |
| burnout | GC6 | How overwhelmed do you feel today? |

**Scale:** 0 = Not at all | 1 = A little | 2 = Somewhat | 3 = Quite a bit | 4 = Extremely

### EMA-3: Momentary Reading

3-item ecological momentary assessment for periodic state tracking. It retains
a native reading and can update the current GiveCare Score after GC-SDOH-6 has
established a structural baseline.

| ID | Domain | Prompt | Scale |
|----|--------|--------|-------|
| stress | stress | How stressed do you feel right now? | 0=none, 4=extreme |
| mood | mood | How would you rate your mood right now? | 0=very low, 4=great |
| coping | coping | How well are you coping today? | 0=not at all, 4=very well |

**EMA-3 reading:** stress is inverted; mood and coping are direct. The three
normalized values are averaged into a separate 0-100 reading.

### GC-SDOH-30: Targeted Deep Dive

All questions are deficit-framed on a 0-4 scale (higher = greater need).

---

#### GC1: Social Support

| ID | Prompt |
|----|--------|
| GC1-1 | How often do you feel you have no one to talk to about caregiving? |
| GC1-2 | How hard is it to find someone to step in when you need a break? |
| GC1-3 | How often do you feel isolated because of your caregiving role? |
| GC1-4 | How difficult is it to ask family or friends for help? |
| GC1-5 | How often do you feel you handle everything alone? |

**Domain Resources:** Support groups, counseling services, respite care, community programs, peer support networks

---

#### GC2: Physical Health

| ID | Prompt |
|----|--------|
| GC2-1 | How much has caregiving worsened your physical health? |
| GC2-2 | How often are you too exhausted to take care of yourself? |
| GC2-3 | How hard is it to get enough sleep because of caregiving? |
| GC2-4 | How often do you skip your own medical appointments? |
| GC2-5 | How much does caregiving interfere with eating well or exercising? |

**Domain Resources:** Respite care services, health screenings, sleep hygiene programs, caregiver wellness programs

---

#### GC3: Housing & Environment

| ID | Prompt |
|----|--------|
| GC3-1 | How unstable does your living situation feel right now? |
| GC3-2 | How hard is it to keep up with home repairs or maintenance? |
| GC3-3 | How often do safety or accessibility issues at home affect caregiving? |
| GC3-4 | How difficult is it to get reliable transportation for care needs? |
| GC3-5 | How much does your neighborhood lack services you need? |

**Domain Resources:** Housing assistance programs, home modification services, transportation subsidies

---

#### GC4: Financial Resources

| ID | Prompt |
|----|--------|
| GC4-1 | How much financial strain is caregiving causing you? |
| GC4-2 | How often do costs prevent you from getting needed care help? |
| GC4-3 | How hard is it to find affordable caregiving support? |
| GC4-4 | How much has caregiving reduced your income or work hours? |
| GC4-5 | How worried are you about long-term financial security? |

**Domain Resources:** Financial assistance programs, benefit enrollment, medication assistance, utility assistance

---

#### GC5: Navigation

| ID | Prompt |
|----|--------|
| GC5-1 | How hard is it to understand or navigate care system options? |
| GC5-2 | How often do confusing rules or paperwork slow you down? |
| GC5-3 | How difficult is it to find trustworthy information about benefits? |
| GC5-4 | How hard is it to deal with legal, insurance, or government forms? |
| GC5-5 | How often do you feel lost trying to coordinate between providers? |

**Domain Resources:** Healthcare navigation support, patient advocacy, legal aid, care coordination services

---

#### GC6: Emotional Wellbeing

| ID | Prompt |
|----|--------|
| GC6-1 | How overwhelmed do you feel by your caregiving responsibilities? |
| GC6-2 | How often do you feel anxious or worried about the future? |
| GC6-3 | How hard is it to find time for things that bring you joy? |
| GC6-4 | How often do you feel guilty about how you handle caregiving? |
| GC6-5 | How much has caregiving affected your sense of who you are? |

**Domain Resources:** Mental health services, emergency planning, stress management, caregiver identity support

---

## Scoring

### Per-Instrument Scoring

All instruments use `scoreInstrument()` which sums raw answers and classifies by ratio:

| Risk Band | Score Ratio |
|-----------|------------|
| Low | < 25% of max |
| Moderate | 25-49% of max |
| High | 50-74% of max |
| Critical | >= 75% of max |

### Composite GiveCare Score (0-100, higher means more capacity)

GC-SDOH-6 supplies one normalized score per domain. A completed GC-SDOH-30 branch
refines only its matching domain. After that structural baseline exists, EMA-3
updates GC2 from stress and GC6 from mood and coping while retaining its native
0-100 reading. The current composite is a weighted average:

| Domain | Weight |
|------|--------|
| GC1: Social Support | 20% |
| GC2: Physical Health | 20% |
| GC3: Housing & Environment | 10% |
| GC4: Financial Resources | 20% |
| GC5: Navigation | 10% |
| GC6: Emotional Wellbeing | 20% |

### Bands

| Band | Score Range |
|------|-----------|
| Strong | 75-100 |
| Steady | 50-74 |
| Building | 25-49 |
| Needs Attention | 0-24 |

Bands are operator and research groupings. They are not validated cutoffs and
are not shown to caregivers.

### Instrument Risk Bands

`scoreInstrument()` also returns a per-instrument `riskBand`, grouping the raw
deficit total by proportion of that instrument's maximum: low below 25%,
moderate below 50%, high below 75%, critical at or above 75%. It runs on the
raw deficit total, so its polarity is the opposite of the composite bands above.

These groupings are intended for operator routing of follow-up. They are not
validated cutoffs and not a validated clinical interpretation. GC-SDOH
instruments record self-reported caregiver needs across the six domains; they
are not validated caregiver burden or well-being instruments, and no band
converts them into one.

### Confidence

| Instruments Completed | Level |
|----------------------|-------|
| 0-1 | Early estimate |
| 2 | Building |
| 3+ | Solid |

### Adaptive Deep-Dive Trigger

Domains scoring below 40 on the composite scale are eligible for four optional GC-SDOH-30 questions in the lowest-scoring domain.

## Implementation

The runtime offers at most one targeted branch from a completed GC-SDOH-6 run. It does not administer the full 30-item bank as a routine step.

### TypeScript SDK

```bash
npm install @givecare/tools
```

```typescript
import { scoreInstrument, computeGiveCareScoreFromInstruments } from '@givecare/tools'

// Score a single instrument
const result = scoreInstrument('gc_sdoh6', 'v2', {
  financial: 3, social: 2, health: 1,
  housing: 0, navigation: 2, burnout: 3,
})
// → { score: 11, maxScore: 24, subscores: {...}, riskBand: 'moderate' }

// Compute composite GiveCare Score
const composite = computeGiveCareScoreFromInstruments([
  { instrument: 'gc_sdoh6', subscores: result.subscores },
])
```

## Evidence Base

The GC-SDOH draws from:
- PRAPARE (Protocol for Responding to and Assessing Patients' Assets, Risks, and Experiences)
- AHC (Accountable Health Communities) screening tool
- U.S. Household Food Security Survey Module
- NAM (National Academy of Medicine) SDOH framework
- CDC Social Determinants of Health guidelines

## Updates & Versioning

**Current Version:** 3.0 (GC-SDOH-30)
**Last Updated:** 2026

### Version History
- **v3.0 (GC-SDOH-30):** Aligned with production. Uniform 5 questions per domain, 0-4 deficit-framed scale, TypeScript SDK with scoring algorithms, added EMA-3 instrument
- **v2.0 (GC-SDOH-30):** Streamlined to 30 questions with 1-5 scale, 6 priority domains
- **v1.0 (GC-SDOH-28):** Initial 28-question assessment with 9 domains

## Citation

Originally created by Ali Madad (@amadad).

```bibtex
@misc{madad_givecare_tools_2026,
  author       = {Ali Madad},
  title        = {{GiveCare Tools}: Open-source frameworks for caregiving support and social determinants of health assessment},
  note         = {GC-SDOH-30 v3.0},
  howpublished = {\url{https://github.com/givecareapp/givecare-tools}},
  year         = {2026}
}
```

---

**License:** MIT. Attribution is requested, not required: credit "GiveCare Tools" and link to this repository when practical.
