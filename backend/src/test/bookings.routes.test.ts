import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/pool.js', () => ({
  pool: { query: vi.fn() },
}))

const { mockCreateCalendarEvent, mockDeleteCalendarEvent } = vi.hoisted(() => ({
  mockCreateCalendarEvent: vi.fn(),
  mockDeleteCalendarEvent: vi.fn(),
}))

vi.mock('../services/calendarService.js', () => ({
  createCalendarEvent: mockCreateCalendarEvent,
  deleteCalendarEvent: mockDeleteCalendarEvent,
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

    mockCreateCalendarEvent.mockResolvedValueOnce({
      googleEventId: 'event-123',
      meetLink: 'https://meet.google.com/abc-defg-hij',
    })

    const res = await request(app)
      .post('/api/bookings')
      .send({ slotId: SLOT.id, traineeId: TRAINEE.id })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      bookingId: 99,
      meetLink: 'https://meet.google.com/abc-defg-hij',
      slot: {
        startTime: SLOT.start_time,
        endTime: SLOT.end_time,
        volunteer: { id: VOLUNTEER.id, name: VOLUNTEER.name, email: VOLUNTEER.email },
      },
    })
  })

  it('returns 409 when the slot is already booked', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...SLOT, status: 'booked' }] })

    const res = await request(app)
      .post('/api/bookings')
      .send({ slotId: SLOT.id, traineeId: TRAINEE.id })

    expect(res.status).toBe(409)
    expect(mockCreateCalendarEvent).not.toHaveBeenCalled()
  })

  it('returns 404 when the slot does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .post('/api/bookings')
      .send({ slotId: 999, traineeId: TRAINEE.id })

    expect(res.status).toBe(404)
    expect(mockCreateCalendarEvent).not.toHaveBeenCalled()
  })

  it('calls createCalendarEvent with the correct volunteer, trainee, and time arguments', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SLOT] })
      .mockResolvedValueOnce({ rows: [VOLUNTEER] })
      .mockResolvedValueOnce({ rows: [TRAINEE] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })

    mockCreateCalendarEvent.mockResolvedValueOnce({
      googleEventId: 'event-123',
      meetLink: 'https://meet.google.com/abc-defg-hij',
    })

    await request(app).post('/api/bookings').send({ slotId: SLOT.id, traineeId: TRAINEE.id })

    expect(mockCreateCalendarEvent).toHaveBeenCalledWith({
      startTime: SLOT.start_time,
      endTime: SLOT.end_time,
      volunteer: { email: VOLUNTEER.email, name: VOLUNTEER.name },
      trainee: { email: TRAINEE.email, name: TRAINEE.name },
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
    google_event_id: 'event-123',
    status: 'confirmed',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cancels the booking, deletes the calendar event, and reopens the slot', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [BOOKING] }) // fetch booking joined with slot
      .mockResolvedValueOnce({ rows: [{ role: 'trainee' }] }) // fetch requesting user
      .mockResolvedValueOnce({ rows: [] }) // update booking status
      .mockResolvedValueOnce({ rows: [] }) // update slot status

    mockDeleteCalendarEvent.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING.id}/cancel`)
      .send({ userId: TRAINEE.id })

    expect(res.status).toBe(200)
    expect(mockDeleteCalendarEvent).toHaveBeenCalledWith(BOOKING.google_event_id)

    const slotUpdateCall = pool.query.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].startsWith('UPDATE time_slots'),
    )
    expect(slotUpdateCall?.[1]).toEqual(['available', BOOKING.slot_id])
  })

  it('returns 403 when the requesting user is neither the volunteer, trainee, nor an admin', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [BOOKING] })
      .mockResolvedValueOnce({ rows: [{ role: 'trainee' }] })

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING.id}/cancel`)
      .send({ userId: 42 })

    expect(res.status).toBe(403)
    expect(mockDeleteCalendarEvent).not.toHaveBeenCalled()
  })

  it('allows cancellation when the requesting user is an admin', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [BOOKING] })
      .mockResolvedValueOnce({ rows: [{ role: 'admin' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    mockDeleteCalendarEvent.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING.id}/cancel`)
      .send({ userId: 7 })

    expect(res.status).toBe(200)
    expect(mockDeleteCalendarEvent).toHaveBeenCalledWith(BOOKING.google_event_id)
  })

  it('returns 404 when the booking does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .patch('/api/bookings/999/cancel')
      .send({ userId: TRAINEE.id })

    expect(res.status).toBe(404)
    expect(mockDeleteCalendarEvent).not.toHaveBeenCalled()
  })
})
