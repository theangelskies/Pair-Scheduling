import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/pool.js', () => ({
  pool: { query: vi.fn() },
}))

import { pool } from '../db/pool.js'
import { getAvailableSlots } from '../services/slots.js'

const MOCK_ROWS = [
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
]

describe('slots service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAvailableSlots returns rows from the database', async () => {
    pool.query.mockResolvedValueOnce({ rows: MOCK_ROWS })

    const slots = await getAvailableSlots()

    expect(slots).toHaveLength(1)
    expect(slots[0].volunteer_name).toBe('Alice García')
    expect(slots[0].status).toBe('available')
  })

  it('getAvailableSlots returns empty array when no slots exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const slots = await getAvailableSlots()

    expect(slots).toEqual([])
  })

  it('getAvailableSlots propagates database errors', async () => {
    pool.query.mockRejectedValueOnce(new Error('connection lost'))

    await expect(getAvailableSlots()).rejects.toThrow('connection lost')
  })

  it('getAvailableSlots returns all slots when multiple exist', async () => {
    const multipleRows = [
      { ...MOCK_ROWS[0], id: 1 },
      { ...MOCK_ROWS[0], id: 2, volunteer_name: 'Bob Mwangi' },
      { ...MOCK_ROWS[0], id: 3, volunteer_name: 'Carmen Liu' },
    ]
    pool.query.mockResolvedValueOnce({ rows: multipleRows })

    const slots = await getAvailableSlots()

    expect(slots).toHaveLength(3)
    expect(slots[2].volunteer_name).toBe('Carmen Liu')
  })

  it('getAvailableSlots returns all expected fields on each slot', async () => {
    pool.query.mockResolvedValueOnce({ rows: MOCK_ROWS })

    const [slot] = await getAvailableSlots()

    expect(slot).toMatchObject({
      id: expect.any(Number),
      volunteer_id: expect.any(Number),
      volunteer_name: expect.any(String),
      start_time: expect.any(String),
      end_time: expect.any(String),
      is_recurring: expect.any(Boolean),
      minimum_notice_hours: expect.any(Number),
      status: expect.any(String),
    })
  })

  it('getAvailableSlots queries the database exactly once', async () => {
    pool.query.mockResolvedValueOnce({ rows: MOCK_ROWS })

    await getAvailableSlots()

    expect(pool.query).toHaveBeenCalledTimes(1)
  })
})
