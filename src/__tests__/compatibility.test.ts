import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// @givecare/tools must keep exporting exactly what 4.0.0 exported, on every subpath.
// The fixture was captured from the 4.0.0 build before the sources moved to packages/assessment.
const here = dirname(fileURLToPath(import.meta.url))
const baseline: Record<string, string[]> = JSON.parse(readFileSync(join(here, 'fixtures', 'tools-api-4.0.0.json'), 'utf8'))

const entries: Record<string, () => Promise<object>> = {
  '.': () => import('../index.js'),
  './assessments': () => import('../assessments.js'),
  './scoring': () => import('../scoring.js'),
}

describe('@givecare/tools compatibility layer', () => {
  for (const [subpath, expected] of Object.entries(baseline)) {
    it(`${subpath} exports the 4.0.0 surface`, async () => {
      const actual = Object.keys(await entries[subpath]()).sort()
      expect(actual).toEqual([...expected].sort())
    })
  }

  it('the baseline covers every subpath in the exports map', () => {
    expect(Object.keys(baseline).sort()).toEqual(Object.keys(entries).sort())
  })
})
