import { describe, it, expect } from 'vitest'
import {
  parseRegulatoryCommand,
  regulatoryResponse,
  isShareKeyword,
} from '../sms/regulatory.js'

// ---------------------------------------------------------------------------
// parseRegulatoryCommand
// ---------------------------------------------------------------------------
describe('parseRegulatoryCommand', () => {
  describe('STOP keywords', () => {
    const stopKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'PAUSE', 'CANCEL', 'END', 'QUIT']

    for (const kw of stopKeywords) {
      it(`parses "${kw}" as STOP`, () => {
        expect(parseRegulatoryCommand(kw)).toBe('STOP')
      })
    }

    it('is case-insensitive', () => {
      expect(parseRegulatoryCommand('stop')).toBe('STOP')
      expect(parseRegulatoryCommand('Stop')).toBe('STOP')
      expect(parseRegulatoryCommand('sToP')).toBe('STOP')
    })

    it('trims whitespace', () => {
      expect(parseRegulatoryCommand('  STOP  ')).toBe('STOP')
      expect(parseRegulatoryCommand('\tSTOP\n')).toBe('STOP')
    })
  })

  describe('START keywords', () => {
    it('parses "START" as START', () => {
      expect(parseRegulatoryCommand('START')).toBe('START')
    })

    it('parses "RESUME" as START', () => {
      expect(parseRegulatoryCommand('RESUME')).toBe('START')
    })

    it('parses "UNSTOP" as UNSTOP', () => {
      expect(parseRegulatoryCommand('UNSTOP')).toBe('UNSTOP')
    })

    it('is case-insensitive', () => {
      expect(parseRegulatoryCommand('start')).toBe('START')
      expect(parseRegulatoryCommand('unstop')).toBe('UNSTOP')
      expect(parseRegulatoryCommand('resume')).toBe('START')
    })
  })

  describe('HELP keywords', () => {
    it('parses "HELP" as HELP', () => {
      expect(parseRegulatoryCommand('HELP')).toBe('HELP')
    })

    it('parses "INFO" as HELP', () => {
      expect(parseRegulatoryCommand('INFO')).toBe('HELP')
    })

    it('is case-insensitive', () => {
      expect(parseRegulatoryCommand('help')).toBe('HELP')
      expect(parseRegulatoryCommand('info')).toBe('HELP')
    })
  })

  describe('non-regulatory messages', () => {
    it('returns null for regular text', () => {
      expect(parseRegulatoryCommand('Hello there')).toBeNull()
      expect(parseRegulatoryCommand('I need help with my mom')).toBeNull()
      expect(parseRegulatoryCommand('Please stop the pain')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(parseRegulatoryCommand('')).toBeNull()
    })

    it('returns null for whitespace only', () => {
      expect(parseRegulatoryCommand('   ')).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// regulatoryResponse
// ---------------------------------------------------------------------------
describe('regulatoryResponse', () => {
  it('returns STOP response with re-subscribe instructions', () => {
    const resp = regulatoryResponse('STOP')
    expect(resp).toContain('unsubscribed')
    expect(resp).toContain('START')
  })

  it('returns START response with unsubscribe option', () => {
    const resp = regulatoryResponse('START')
    expect(resp).toContain('re-subscribed')
    expect(resp).toContain('STOP')
  })

  it('returns same response for UNSTOP as START', () => {
    expect(regulatoryResponse('UNSTOP')).toBe(regulatoryResponse('START'))
  })

  it('returns HELP response with crisis line', () => {
    const resp = regulatoryResponse('HELP')
    expect(resp).toContain('988')
    expect(resp).toContain('STOP')
  })
})

// ---------------------------------------------------------------------------
// isShareKeyword
// ---------------------------------------------------------------------------
describe('isShareKeyword', () => {
  it('matches "share" case-insensitively', () => {
    expect(isShareKeyword('share')).toBe(true)
    expect(isShareKeyword('SHARE')).toBe(true)
    expect(isShareKeyword('Share')).toBe(true)
  })

  it('trims whitespace', () => {
    expect(isShareKeyword('  share  ')).toBe(true)
  })

  it('rejects partial matches', () => {
    expect(isShareKeyword('share this')).toBe(false)
    expect(isShareKeyword('please share')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isShareKeyword('')).toBe(false)
  })
})
