import { describe, it, expect } from 'vitest'
import {
  inferTimezoneFromAreaCode,
  parseTimezoneResponse,
  TZ_DISPLAY_NAME,
} from '../geo/timezone.js'

// ---------------------------------------------------------------------------
// inferTimezoneFromAreaCode
// ---------------------------------------------------------------------------
describe('inferTimezoneFromAreaCode', () => {
  it('maps NYC area code to Eastern', () => {
    expect(inferTimezoneFromAreaCode('+12125551234')).toBe('America/New_York')
  })

  it('maps Chicago area code to Central', () => {
    expect(inferTimezoneFromAreaCode('+13125551234')).toBe('America/Chicago')
  })

  it('maps Denver area code to Mountain', () => {
    expect(inferTimezoneFromAreaCode('+13035551234')).toBe('America/Denver')
  })

  it('maps LA area code to Pacific', () => {
    expect(inferTimezoneFromAreaCode('+13105551234')).toBe('America/Los_Angeles')
  })

  it('maps Alaska area code', () => {
    expect(inferTimezoneFromAreaCode('+19075551234')).toBe('America/Anchorage')
  })

  it('maps Hawaii area code', () => {
    expect(inferTimezoneFromAreaCode('+18085551234')).toBe('Pacific/Honolulu')
  })

  it('defaults to Eastern for unknown area code', () => {
    expect(inferTimezoneFromAreaCode('+10005551234')).toBe('America/New_York')
  })

  it('defaults to Eastern for non-US number', () => {
    expect(inferTimezoneFromAreaCode('+442071234567')).toBe('America/New_York')
  })

  it('defaults to Eastern for short number', () => {
    expect(inferTimezoneFromAreaCode('+1')).toBe('America/New_York')
    expect(inferTimezoneFromAreaCode('')).toBe('America/New_York')
  })
})

// ---------------------------------------------------------------------------
// parseTimezoneResponse
// ---------------------------------------------------------------------------
describe('parseTimezoneResponse', () => {
  const inferred = 'America/New_York'

  it('returns inferred for empty/skip/pass responses', () => {
    expect(parseTimezoneResponse('', inferred)).toBe(inferred)
    expect(parseTimezoneResponse('skip', inferred)).toBe(inferred)
    expect(parseTimezoneResponse('PASS', inferred)).toBe(inferred)
    expect(parseTimezoneResponse('no', inferred)).toBe(inferred)
    expect(parseTimezoneResponse('later', inferred)).toBe(inferred)
  })

  it('returns inferred for confirmation responses', () => {
    expect(parseTimezoneResponse('yes', inferred)).toBe(inferred)
    expect(parseTimezoneResponse('yep', inferred)).toBe(inferred)
    expect(parseTimezoneResponse('ok', inferred)).toBe(inferred)
    expect(parseTimezoneResponse('sure', inferred)).toBe(inferred)
    expect(parseTimezoneResponse("that's right", inferred)).toBe(inferred)
  })

  it('parses timezone keywords', () => {
    expect(parseTimezoneResponse('pacific', inferred)).toBe('America/Los_Angeles')
    expect(parseTimezoneResponse('central', inferred)).toBe('America/Chicago')
    expect(parseTimezoneResponse('mountain', inferred)).toBe('America/Denver')
    expect(parseTimezoneResponse('eastern', inferred)).toBe('America/New_York')
    expect(parseTimezoneResponse('hawaii', inferred)).toBe('Pacific/Honolulu')
    expect(parseTimezoneResponse('alaska', inferred)).toBe('America/Anchorage')
  })

  it('parses abbreviations', () => {
    expect(parseTimezoneResponse('pst', inferred)).toBe('America/Los_Angeles')
    expect(parseTimezoneResponse('cst', inferred)).toBe('America/Chicago')
    expect(parseTimezoneResponse('mst', inferred)).toBe('America/Denver')
    expect(parseTimezoneResponse('est', inferred)).toBe('America/New_York')
    expect(parseTimezoneResponse('pt', inferred)).toBe('America/Los_Angeles')
    expect(parseTimezoneResponse('ct', inferred)).toBe('America/Chicago')
    expect(parseTimezoneResponse('mt', inferred)).toBe('America/Denver')
    expect(parseTimezoneResponse('et', inferred)).toBe('America/New_York')
  })

  it('is case-insensitive', () => {
    expect(parseTimezoneResponse('PACIFIC', inferred)).toBe('America/Los_Angeles')
    expect(parseTimezoneResponse('Pacific Time', inferred)).toBe('America/Los_Angeles')
  })

  it('falls back to inferred for unrecognized text', () => {
    expect(parseTimezoneResponse('somewhere in Europe', inferred)).toBe(inferred)
  })
})

// ---------------------------------------------------------------------------
// TZ_DISPLAY_NAME
// ---------------------------------------------------------------------------
describe('TZ_DISPLAY_NAME', () => {
  it('has display names for all standard US timezones', () => {
    expect(TZ_DISPLAY_NAME['America/New_York']).toBe('Eastern')
    expect(TZ_DISPLAY_NAME['America/Chicago']).toBe('Central')
    expect(TZ_DISPLAY_NAME['America/Denver']).toBe('Mountain')
    expect(TZ_DISPLAY_NAME['America/Los_Angeles']).toBe('Pacific')
    expect(TZ_DISPLAY_NAME['America/Anchorage']).toBe('Alaska')
    expect(TZ_DISPLAY_NAME['Pacific/Honolulu']).toBe('Hawaii')
  })
})
