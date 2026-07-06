import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/pool.js', () => ({
  pool: { query: vi.fn() },
}))

const { mockCreateMeetingLink, mockSendConfirmation, mockSendCancellation } = vi.hoisted(() => ({
  mockCreateMeetingLink: vi.fn(),
  mockSendConfirmation: vi.fn(),
  mockSendCancellation: vi.fn(),
}))

vi.mock('../services/calendarService.js', () => ({
  createMeetingLink: mockCreateMeetingLink,
}))

vi.mock('../services/emailService.js', () => ({
  sendBookingConfirmationEmail: mockSendConfirmation,
  sendBookingCancellationEmail: mockSendCancellation,
}))

import express from 'express'
import request from 'supertest'
import { pool } from '../db/pool.js'
import bookingsRouter from '../routes/bookings.js'

const app = express()
app.use(express.json())
app.use('/api/bookings', bookingsRouter)

const SLOT = {
  id: 10,
  volunteer_id: 1,
  start_time: '2026-08-01T10:00:00Z',
  end_time: '2026-08-01T11:00:00Z',
  status: 'available',
}

const VOLUNTEER = { id: 1, name: 'Alice García', email: 'alice@example.com', role: 'volunteer' }
const TRAINEE = { id: 3, name: 'Carmen Liu', email: 'carmen@example.com', role: 'trainee' }

describe('POST /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('books a slot successfully and returns a meet link', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SLOT] }) // fetch slot
      .mockResolvedValueOnce({ rows: [VOLUNTEER] }) // fetch volunteer
      .mockResolvedValueOnce({ rows: [TRAINEE] }) // fetch trainee
      .mockResolvedValueOnce({ rows: [] }) // mark slot booked
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // insert booking

    mockCreateMeetingLink.mockReturnValueOnce({
      meetLink: 'https://meet.jit.si/pair-scheduling-abc123',
    })

    const res = await request(app)
      .post('/api/bookings')
      .send({ slotId: SLOT.id, traineeId: TRAINEE.id })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      bookingId: 99,
      meetLink: 'https://meet.jit.si/pair-scheduling-abc123',
      slot: {
        startTime: SLOT.start_time,
        endTime: SLOT.end_time,
        volunteer: { id: VOLUNTEER.id, name: VOLUNTEER.name, email: VOLUNTEER.email },
      },
    })
  })

  it('saves the agenda text on the booking when provided', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SLOT] })
      .mockResolvedValueOnce({ rows: [VOLUNTEER] })
      .mockResolvedValueOnce({ rows: [TRAINEE] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })

    mockCreateMeetingLink.mockReturnValueOnce({
      meetLink: 'https://meet.jit.si/pair-scheduling-abc123',
    })

    await request(app)
      .post('/api/bookings')
      .send({ slotId: SLOT.id, traineeId: TRAINEE.id, agenda: 'Help debugging a React hook' })

    const insertCall = pool.query.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO bookings'),
    )
    expect(insertCall?.[1]).toEqual([SLOT.id, TRAINEE.id, 'https://meet.jit.si/pair-scheduling-abc123', 'Help debugging a React hook'])
  })

  it('returns 409 when the slot is already booked', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...SLOT, status: 'booked' }] })

    const res = await request(app)
      .post('/api/bookings')
      .send({ slotId: SLOT.id, traineeId: TRAINEE.id })

    expect(res.status).toBe(409)
    expect(mockCreateMeetingLink).not.toHaveBeenCalled()
  })

  it('returns 404 when the slot does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .post('/api/bookings')
      .send({ slotId: 999, traineeId: TRAINEE.id })

    expect(res.status).toBe(404)
    expect(mockCreateMeetingLink).not.toHaveBeenCalled()
  })

  it('sends a booking confirmation email to the volunteer and trainee', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SLOT] })
      .mockResolvedValueOnce({ rows: [VOLUNTEER] })
      .mockResolvedValueOnce({ rows: [TRAINEE] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })

    mockCreateMeetingLink.mockReturnValueOnce({
      meetLink: 'https://meet.jit.si/pair-scheduling-abc123',
    })

    await request(app).post('/api/bookings').send({ slotId: SLOT.id, traineeId: TRAINEE.id })

    expect(mockSendConfirmation).toHaveBeenCalledWith({
      volunteer: { email: VOLUNTEER.email, name: VOLUNTEER.name },
      trainee: { email: TRAINEE.email, name: TRAINEE.name },
      startTime: SLOT.start_time,
      endTime: SLOT.end_time,
      meetLink: 'https://meet.jit.si/pair-scheduling-abc123',
    })
  })

  it('returns 400 when slotId or traineeId is missing', async () => {
    const res = await request(app).post('/api/bookings').send({ slotId: SLOT.id })

    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/bookings/:id/cancel', () => {
  const BOOKING = {
    id: 99,
    slot_id: SLOT.id,
    trainee_id: TRAINEE.id,
    volunteer_id: VOLUNTEER.id,
    status: 'confirmed',
    start_time: SLOT.start_time,
    end_time: SLOT.end_time,
    volunteer_name: VOLUNTEER.name,
    volunteer_email: VOLUNTEER.email,
    trainee_name: TRAINEE.name,
    trainee_email: TRAINEE.email,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cancels the booking and reopens the slot', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [BOOKING] }) // fetch booking joined with slot
      .mockResolvedValueOnce({ rows: [{ role: 'trainee' }] }) // fetch requesting user
      .mockResolvedValueOnce({ rows: [] }) // update booking status
      .mockResolvedValueOnce({ rows: [] }) // update slot status

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING.id}/cancel`)
      .send({ userId: TRAINEE.id })

    expect(res.status).toBe(200)

    const slotUpdateCall = pool.query.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].startsWith('UPDATE time_slots'),
    )
    expect(slotUpdateCall?.[1]).toEqual(['available', BOOKING.slot_id])

    expect(mockSendCancellation).toHaveBeenCalledWith({
      volunteer: { email: VOLUNTEER.email, name: VOLUNTEER.name },
      trainee: { email: TRAINEE.email, name: TRAINEE.name },
      startTime: SLOT.start_time,
      endTime: SLOT.end_time,
    })
  })

  it('returns 403 when the requesting user is neither the volunteer, trainee, nor an admin', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [BOOKING] })
      .mockResolvedValueOnce({ rows: [{ role: 'trainee' }] })

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING.id}/cancel`)
      .send({ userId: 42 })

    expect(res.status).toBe(403)
    expect(mockSendCancellation).not.toHaveBeenCalled()
  })

  it('allows cancellation when the requesting user is an admin', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [BOOKING] })
      .mockResolvedValueOnce({ rows: [{ role: 'admin' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING.id}/cancel`)
      .send({ userId: 7 })

    expect(res.status).toBe(200)
  })

  it('returns 404 when the booking does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .patch('/api/bookings/999/cancel')
      .send({ userId: TRAINEE.id })

    expect(res.status).toBe(404)
  })
})
