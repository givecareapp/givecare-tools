import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { buildInstrumentExport } from '../assessments/instrumentExport.js'

// The committed snapshot `data/instruments-export.json` is the canonical shared
// instrument artifact. Consumers sync its verified ArtifactRef.
// `scripts/project-instruments.ts` regenerates it. `npm run ci` then rejects
// source changes that were not projected.
const SNAPSHOT_PATH = join(process.cwd(), 'data/instruments-export.json')

function serialize(): string {
  return `${JSON.stringify(buildInstrumentExport(), null, 2)}\n`
}

describe('instruments export snapshot', () => {
  it('data/instruments-export.json matches source (run npm run project:instruments if this fails)', () => {
    expect(readFileSync(SNAPSHOT_PATH, 'utf8')).toBe(serialize())
  })

  it('projects all three instruments with ids, prompts, and domains', () => {
    const snap = buildInstrumentExport()
    expect(Object.keys(snap.instruments)).toEqual(['gc_sdoh6', 'ema3', 'gc_sdoh30'])
    expect(snap.instruments.gc_sdoh6).toHaveLength(6)
    expect(snap.instruments.ema3).toHaveLength(3)
    expect(snap.instruments.gc_sdoh30).toHaveLength(30)
    // SDOH-6 and SDOH-30 are domain-anchored; EMA-3 is a separate reading.
    expect(snap.instruments.gc_sdoh6.every(q => q.gcDomain !== undefined)).toBe(true)
    expect(snap.instruments.gc_sdoh30.every(q => q.gcDomain !== undefined)).toBe(true)
    expect(snap.instruments.ema3.every(q => q.gcDomain === undefined)).toBe(true)
    expect(snap.domainWeights).toEqual({ GC1: 0.2, GC2: 0.2, GC3: 0.1, GC4: 0.2, GC5: 0.1, GC6: 0.2 })
    expect(snap.domainLabels).toEqual({
      GC1: 'Social Support',
      GC2: 'Physical Health',
      GC3: 'Housing & Environment',
      GC4: 'Financial Resources',
      GC5: 'Navigation',
      GC6: 'Emotional Wellbeing',
    })
  })
})
