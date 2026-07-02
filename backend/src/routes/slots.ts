import { Router } from 'express'
import { getAvailableSlots } from '../services/slots.js'
import { pool } from '../db/pool.js'

const router = Router()

router.get('/available', async (_req, res) => {
  try {
    const slots = await getAvailableSlots()
    res.json(slots)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database fetch failed' })
  }
})

router.post('/', async (req, res) => {
  const { volunteer_id, start_time, end_time, is_recurring, minimum_notice_hours } = req.body as {
    volunteer_id: number
    start_time: string
    end_time: string
    is_recurring: boolean
    minimum_notice_hours: number
  }
  try {
    const result = await pool.query(
      `INSERT INTO time_slots (volunteer_id, start_time, end_time, is_recurring, minimum_notice_hours)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [volunteer_id, start_time, end_time, is_recurring, minimum_notice_hours],
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save slot' })
  }
})

export default router
