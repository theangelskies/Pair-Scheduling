import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/pool.js', () => ({
  pool: { query: vi.fn() },
}))

import express from 'express'
import request from 'supertest'
import { pool } from '../db/pool.js'
import slotsRouter from '../routes/slots.js'

const app = express()
app.use(express.json())
app.use('/api/slots', slotsRouter)

const MOCK_SLOTS = [
  {
    id: 1,
    volunteer_id: 1,
    start_time: '2026-08-01T10:00:00Z',
    end_time: '2026-08-01T11:00:00Z',
    is_recurring: false,
    minimum_notice_hours: 24,
    status: 'available',
    volunteer_name: 'Alice García',
  },
  {
    id: 2,
    volunteer_id: 2,
    start_time: '2026-08-02T14:00:00Z',
    end_time: '2026-08-02T15:00:00Z',
    is_recurring: false,
    minimum_notice_hours: 24,
    status: 'available',
    volunteer_name: 'Bob Mwangi',
  },
]

describe('GET /api/slots/available', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with available slots', async () => {
    pool.query.mockResolvedValueOnce({ rows: MOCK_SLOTS })

    const res = await request(app).get('/api/slots/available')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('returns slots with the correct shape', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_SLOTS[0]] })

    const res = await request(app).get('/api/slots/available')
    const slot = res.body[0]

    expect(slot).toMatchObject({
      id: 1,
      volunteer_name: 'Alice García',
      status: 'available',
      start_time: expect.any(String),
      end_time: expect.any(String),
    })
  })

  it('returns 200 with empty array when no slots are available', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app).get('/api/slots/available')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 500 when the database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'))

    const res = await request(app).get('/api/slots/available')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Database fetch failed' })
  })

  it('responds with JSON content type', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app).get('/api/slots/available')

    expect(res.headers['content-type']).toMatch(/application\/json/)
  })

  it('preserves slot order returned by the database', async () => {
    pool.query.mockResolvedValueOnce({ rows: MOCK_SLOTS })

    const res = await request(app).get('/api/slots/available')

    expect(res.body[0].id).toBe(1)
    expect(res.body[1].id).toBe(2)
  })

  it('passes all slot fields through to the response', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_SLOTS[0]] })

    const res = await request(app).get('/api/slots/available')

    expect(res.body[0]).toEqual(MOCK_SLOTS[0])
  })
})

describe('GET /api/slots/mine', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when volunteerId is missing', async () => {
    const res = await request(app).get('/api/slots/mine')

    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it("returns all of the volunteer's slots regardless of status", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { ...MOCK_SLOTS[0], status: 'available', trainee_name: null, booking_id: null },
        { ...MOCK_SLOTS[0], id: 3, status: 'booked', trainee_name: 'Carmen Liu', booking_id: 42 },
      ],
    })

    const res = await request(app).get('/api/slots/mine').query({ volunteerId: 1 })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[1]).toMatchObject({
      status: 'booked',
      trainee_name: 'Carmen Liu',
      booking_id: 42,
    })
  })

  it('filters by the given volunteerId', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    await request(app).get('/api/slots/mine').query({ volunteerId: 4 })

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE ts.volunteer_id = $1'), [
      '4',
    ])
  })

  it('returns 500 when the database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'))

    const res = await request(app).get('/api/slots/mine').query({ volunteerId: 1 })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Database fetch failed' })
  })
})

describe('POST /api/slots', () => {
  beforeEach(() => vi.clearAllMocks())

  const PAYLOAD = {
    volunteer_id: 1,
    start_time: '2099-01-01T10:00:00Z',
    end_time: '2099-01-01T11:00:00Z',
  }

  it('creates the slot when no overlapping slot exists', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [{ id: 5, ...PAYLOAD, status: 'available' }] }) // insert

    const res = await request(app).post('/api/slots').send(PAYLOAD)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ id: 5 })
  })

  it('rejects with 409 when the volunteer already has an overlapping slot', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 99 }] }) // overlap check finds a match

    const res = await request(app).post('/api/slots').send(PAYLOAD)

    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'You already have a slot that overlaps this time range' })
    expect(pool.query).toHaveBeenCalledTimes(1)
  })
})

describe('DELETE /api/slots/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes an available slot', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 7 }] })

    const res = await request(app).delete('/api/slots/7')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("status = 'available'"), ['7'])
  })

  it('returns 409 when the slot is already booked or does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app).delete('/api/slots/7')

    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'Slot not found or already booked' })
  })

  it('returns 500 when the database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'))

    const res = await request(app).delete('/api/slots/7')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to cancel slot' })
  })
})
