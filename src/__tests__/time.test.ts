import { describe, it, expect } from 'vitest'
import { days } from '../lib/time.js'

describe('days', () => {
  it('returns milliseconds for 1 day', () => {
    expect(days(1)).toBe(86_400_000)
  })

  it('returns 0 for 0 days', () => {
    expect(days(0)).toBe(0)
  })

  it('handles fractional days', () => {
    expect(days(0.5)).toBe(43_200_000) // 12 hours
  })

  it('handles multiple days', () => {
    expect(days(7)).toBe(604_800_000)
    expect(days(30)).toBe(2_592_000_000)
  })
})
