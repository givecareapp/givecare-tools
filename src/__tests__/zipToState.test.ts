import { describe, it, expect } from 'vitest'
import { zipToState } from '../geo/zipToState.js'

describe('zipToState', () => {
  it('maps New York City ZIP to NY', () => {
    expect(zipToState('10001')).toBe('NY')
    expect(zipToState('10128')).toBe('NY')
  })

  it('maps Los Angeles ZIP to CA', () => {
    expect(zipToState('90001')).toBe('CA')
    expect(zipToState('90210')).toBe('CA')
  })

  it('maps Chicago ZIP to IL', () => {
    expect(zipToState('60601')).toBe('IL')
  })

  it('maps Houston ZIP to TX', () => {
    expect(zipToState('77001')).toBe('TX')
  })

  it('maps DC ZIP to DC', () => {
    expect(zipToState('20001')).toBe('DC')
    expect(zipToState('20500')).toBe('DC')
  })

  it('maps Alaska ZIP to AK', () => {
    expect(zipToState('99501')).toBe('AK')
  })

  it('maps Hawaii ZIP to HI', () => {
    expect(zipToState('96701')).toBe('HI')
  })

  it('maps Puerto Rico ZIP to PR', () => {
    expect(zipToState('00901')).toBe('PR')
  })

  it('maps Guam ZIP to GU', () => {
    expect(zipToState('96910')).toBe('GU')
  })

  it('works with 3-digit prefix only', () => {
    expect(zipToState('100')).toBe('NY')
  })

  it('returns null for null/empty/short input', () => {
    expect(zipToState('')).toBeNull()
    expect(zipToState('1')).toBeNull()
    expect(zipToState('12')).toBeNull()
  })

  it('returns null for non-numeric input', () => {
    expect(zipToState('abc')).toBeNull()
    expect(zipToState('abcde')).toBeNull()
  })

  it('returns null for unassigned prefix', () => {
    // 00000-00005 is below the first range (6)
    expect(zipToState('00100')).toBeNull()
    // Gaps in the range table
    expect(zipToState('09000')).toBeNull()
  })

  it('handles boundary ZIP codes', () => {
    // First valid range starts at prefix 6 (PR)
    expect(zipToState('00600')).toBe('PR')
    // Last valid range ends at prefix 999 (AK)
    expect(zipToState('99999')).toBe('AK')
  })
})
