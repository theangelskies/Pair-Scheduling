import { describe, it, expect } from 'vitest'
import { createMeetingLink } from '../services/calendarService.js'

describe('calendarService', () => {
  describe('createMeetingLink', () => {
    it('returns a Jitsi Meet link in the pair-scheduling room format', () => {
      const { meetLink } = createMeetingLink()

      expect(meetLink).toMatch(/^https:\/\/meet\.jit\.si\/pair-scheduling-[0-9a-f]{16}$/)
    })

    it('generates a unique room link on each call', () => {
      const first = createMeetingLink()
      const second = createMeetingLink()

      expect(first.meetLink).not.toBe(second.meetLink)
    })
  })
})
