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

  it('returns 200 with an empty array when no slots are available', async () => {
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
})
