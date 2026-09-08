import { describe, it, expect } from 'vitest'
import {
  inferTimezoneFromAreaCode,
  parseTimezoneResponse,
  TZ_DISPLAY_NAME,
  zipToState,
} from '../geo/index.js'

describe('geo barrel', () => {
  it('exports timezone and ZIP/state helpers from the aggregate geo module', () => {
    expect(inferTimezoneFromAreaCode('+12125551234')).toBe('America/New_York')
    expect(parseTimezoneResponse('pacific', 'America/New_York')).toBe('America/Los_Angeles')
    expect(TZ_DISPLAY_NAME['America/Chicago']).toBe('Central')
    expect(zipToState('10001')).toBe('NY')
  })
})
