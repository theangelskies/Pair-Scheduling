import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInsert, mockDelete, JWTMock } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockDelete: vi.fn(),
  JWTMock: vi.fn(),
}))

vi.mock('googleapis', () => ({
  google: {
    auth: { JWT: JWTMock },
    calendar: vi.fn(() => ({
      events: { insert: mockInsert, delete: mockDelete },
    })),
  },
}))

import { createCalendarEvent, deleteCalendarEvent } from '../services/calendarService.js'

const VOLUNTEER = { email: 'volunteer@example.com', name: 'Alice García' }
const TRAINEE = { email: 'trainee@example.com', name: 'Carmen Liu' }

describe('calendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'service-account@example.iam.gserviceaccount.com'
    process.env.GOOGLE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\nFAKEKEYDATA\\n-----END PRIVATE KEY-----\\n'
  })

  describe('createCalendarEvent', () => {
    it('returns the googleEventId and meetLink from the created event', async () => {
      mockInsert.mockResolvedValueOnce({
        data: { id: 'event-123', hangoutLink: 'https://meet.google.com/abc-defg-hij' },
      })

      const result = await createCalendarEvent({
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
      })

      expect(result).toEqual({
        googleEventId: 'event-123',
        meetLink: 'https://meet.google.com/abc-defg-hij',
      })
    })

    it('does not include attendees on the event (service account cannot invite without Domain-Wide Delegation)', async () => {
      mockInsert.mockResolvedValueOnce({ data: { id: 'event-123', hangoutLink: 'link' } })

      await createCalendarEvent({
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
      })

      const call = mockInsert.mock.calls[0][0]
      expect(call.requestBody.attendees).toBeUndefined()
    })

    it('includes both names in the event summary', async () => {
      mockInsert.mockResolvedValueOnce({ data: { id: 'event-123', hangoutLink: 'link' } })

      await createCalendarEvent({
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
      })

      const call = mockInsert.mock.calls[0][0]
      expect(call.requestBody.summary).toContain(VOLUNTEER.name)
      expect(call.requestBody.summary).toContain(TRAINEE.name)
    })

    it('requests conferenceData to generate a Google Meet link', async () => {
      mockInsert.mockResolvedValueOnce({ data: { id: 'event-123', hangoutLink: 'link' } })

      await createCalendarEvent({
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
      })

      const call = mockInsert.mock.calls[0][0]
      expect(call.conferenceDataVersion).toBe(1)
      expect(call.requestBody.conferenceData.createRequest.conferenceSolutionKey.type).toBe(
        'hangoutsMeet',
      )
    })

    it('replaces escaped \\n sequences in the private key with real line breaks', async () => {
      mockInsert.mockResolvedValueOnce({ data: { id: 'event-123', hangoutLink: 'link' } })

      await createCalendarEvent({
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
      })

      const jwtArgs = JWTMock.mock.calls[0][0]
      expect(jwtArgs.key).toContain('\n')
      expect(jwtArgs.key).not.toContain('\\n')
    })

    it('falls back to the conferenceData video entry point when hangoutLink is absent', async () => {
      mockInsert.mockResolvedValueOnce({
        data: {
          id: 'event-456',
          conferenceData: {
            entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/xyz-uvwx-rst' }],
          },
        },
      })

      const result = await createCalendarEvent({
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
      })

      expect(result.meetLink).toBe('https://meet.google.com/xyz-uvwx-rst')
    })
  })

  describe('deleteCalendarEvent', () => {
    it('deletes the event by googleEventId', async () => {
      mockDelete.mockResolvedValueOnce({})

      await deleteCalendarEvent('event-123')

      expect(mockDelete).toHaveBeenCalledWith(
        expect.objectContaining({ calendarId: 'primary', eventId: 'event-123' }),
      )
    })

  })
})
