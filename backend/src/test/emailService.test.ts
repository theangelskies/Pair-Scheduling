import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

vi.stubGlobal('fetch', mockFetch)

import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from '../services/emailService.js'

const VOLUNTEER = { email: 'volunteer@example.com', name: 'Alice García' }
const TRAINEE = { email: 'trainee@example.com', name: 'Carmen Liu' }

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BREVO_API_KEY = 'test-brevo-key'
    process.env.BREVO_SENDER_EMAIL = 'ourpairscheduling@gmail.com'
    process.env.BREVO_SENDER_NAME = 'Pair Scheduling App'
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  describe('sendBookingConfirmationEmail', () => {
    it('sends one email to the volunteer and one to the trainee', async () => {
      await sendBookingConfirmationEmail({
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        meetLink: 'https://meet.google.com/abc-defg-hij',
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('calls the Brevo transactional email API with the api-key header', async () => {
      await sendBookingConfirmationEmail({
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        meetLink: 'https://meet.google.com/abc-defg-hij',
      })

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.brevo.com/v3/smtp/email')
      expect(options.headers['api-key']).toBe('test-brevo-key')
    })

    it("sends the volunteer's email addressed to them with the trainee's name in the body", async () => {
      await sendBookingConfirmationEmail({
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        meetLink: 'https://meet.google.com/abc-defg-hij',
      })

      const volunteerCall = mockFetch.mock.calls.find((call) => {
        const body = JSON.parse(call[1].body)
        return body.to[0].email === VOLUNTEER.email
      })
      const body = JSON.parse(volunteerCall![1].body)

      expect(body.to).toEqual([{ email: VOLUNTEER.email, name: VOLUNTEER.name }])
      expect(body.htmlContent).toContain(TRAINEE.name)
      expect(body.htmlContent).toContain('https://meet.google.com/abc-defg-hij')
    })

    it("sends the trainee's email addressed to them with the volunteer's name in the body", async () => {
      await sendBookingConfirmationEmail({
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        meetLink: 'https://meet.google.com/abc-defg-hij',
      })

      const traineeCall = mockFetch.mock.calls.find((call) => {
        const body = JSON.parse(call[1].body)
        return body.to[0].email === TRAINEE.email
      })
      const body = JSON.parse(traineeCall![1].body)

      expect(body.to).toEqual([{ email: TRAINEE.email, name: TRAINEE.name }])
      expect(body.htmlContent).toContain(VOLUNTEER.name)
      expect(body.htmlContent).toContain('https://meet.google.com/abc-defg-hij')
    })

    it('uses the configured sender name and email', async () => {
      await sendBookingConfirmationEmail({
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
        meetLink: 'https://meet.google.com/abc-defg-hij',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.sender).toEqual({
        name: 'Pair Scheduling App',
        email: 'ourpairscheduling@gmail.com',
      })
    })
  })

  describe('sendBookingCancellationEmail', () => {
    it('sends one cancellation email to the volunteer and one to the trainee', async () => {
      await sendBookingCancellationEmail({
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('mentions cancellation and the other person in each email body', async () => {
      await sendBookingCancellationEmail({
        volunteer: VOLUNTEER,
        trainee: TRAINEE,
        startTime: '2026-08-01T10:00:00Z',
        endTime: '2026-08-01T11:00:00Z',
      })

      const volunteerCall = mockFetch.mock.calls.find((call) => {
        const body = JSON.parse(call[1].body)
        return body.to[0].email === VOLUNTEER.email
      })
      const body = JSON.parse(volunteerCall![1].body)

      expect(body.subject.toLowerCase()).toContain('cancel')
      expect(body.htmlContent).toContain(TRAINEE.name)
    })
  })
})
