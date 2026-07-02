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
})
