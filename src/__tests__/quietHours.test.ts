import { describe, it, expect } from 'vitest'
import { isQuietHoursNow, nextAllowedSendAt } from '../sms/quietHours.js'

// Helper: create a timestamp for a specific hour in a given timezone.
// We use Intl to confirm the local hour matches what we expect.
function timestampAtLocalHour(hour: number, tz: string): number {
  // Start from a known date and adjust until the local hour matches
  const base = new Date('2025-06-15T00:00:00Z')
  for (let offset = 0; offset < 48; offset++) {
    const candidate = base.getTime() + offset * 3600_000
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(candidate))
    if (parseInt(formatted, 10) === hour) return candidate
  }
  throw new Error(`Could not find timestamp for hour ${hour} in ${tz}`)
}

const TZ = 'America/New_York'

// ---------------------------------------------------------------------------
// isQuietHoursNow
// ---------------------------------------------------------------------------
describe('isQuietHoursNow', () => {
  it('returns false when disabled', () => {
    const at22 = timestampAtLocalHour(22, TZ)
    expect(isQuietHoursNow({ now: at22, timezone: TZ, enabled: false })).toBe(false)
  })

  it('returns true during default quiet window (21:00 - 08:00)', () => {
    const at22 = timestampAtLocalHour(22, TZ)
    expect(isQuietHoursNow({ now: at22, timezone: TZ, enabled: true })).toBe(true)
  })

  it('returns true at exactly start hour (21)', () => {
    const at21 = timestampAtLocalHour(21, TZ)
    expect(isQuietHoursNow({ now: at21, timezone: TZ, enabled: true })).toBe(true)
  })

  it('returns true at 3 AM (middle of quiet window)', () => {
    const at3 = timestampAtLocalHour(3, TZ)
    expect(isQuietHoursNow({ now: at3, timezone: TZ, enabled: true })).toBe(true)
  })

  it('returns false at exactly end hour (08)', () => {
    const at8 = timestampAtLocalHour(8, TZ)
    expect(isQuietHoursNow({ now: at8, timezone: TZ, enabled: true })).toBe(false)
  })

  it('returns false during daytime (14:00)', () => {
    const at14 = timestampAtLocalHour(14, TZ)
    expect(isQuietHoursNow({ now: at14, timezone: TZ, enabled: true })).toBe(false)
  })

  it('respects custom start/end hours', () => {
    const at23 = timestampAtLocalHour(23, TZ)
    // Custom window: 23:00 - 06:00
    expect(isQuietHoursNow({
      now: at23, timezone: TZ, enabled: true, startHour: 23, endHour: 6,
    })).toBe(true)
    // 22:00 should be outside 23:00-06:00
    const at22 = timestampAtLocalHour(22, TZ)
    expect(isQuietHoursNow({
      now: at22, timezone: TZ, enabled: true, startHour: 23, endHour: 6,
    })).toBe(false)
  })

  it('handles same start and end (no quiet window)', () => {
    const at22 = timestampAtLocalHour(22, TZ)
    expect(isQuietHoursNow({
      now: at22, timezone: TZ, enabled: true, startHour: 21, endHour: 21,
    })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// nextAllowedSendAt
// ---------------------------------------------------------------------------
describe('nextAllowedSendAt', () => {
  it('returns now when quiet hours are disabled', () => {
    const at22 = timestampAtLocalHour(22, TZ)
    expect(nextAllowedSendAt({ now: at22, timezone: TZ, enabled: false })).toBe(at22)
  })

  it('returns now when outside quiet hours', () => {
    const at14 = timestampAtLocalHour(14, TZ)
    expect(nextAllowedSendAt({ now: at14, timezone: TZ, enabled: true })).toBe(at14)
  })

  it('advances to after quiet hours when inside quiet window', () => {
    const at22 = timestampAtLocalHour(22, TZ)
    const result = nextAllowedSendAt({ now: at22, timezone: TZ, enabled: true })
    expect(result).toBeGreaterThan(at22)
    // The returned time should be outside quiet hours
    expect(isQuietHoursNow({ now: result, timezone: TZ, enabled: true })).toBe(false)
  })

  it('returned timestamp is a reasonable future time (within 12 hours)', () => {
    const at3 = timestampAtLocalHour(3, TZ)
    const result = nextAllowedSendAt({ now: at3, timezone: TZ, enabled: true })
    const hoursAhead = (result - at3) / (60 * 60 * 1000)
    expect(hoursAhead).toBeLessThan(12)
    expect(hoursAhead).toBeGreaterThanOrEqual(0)
  })
})
