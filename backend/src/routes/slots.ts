import { Router } from 'express'
import { pool } from '../db/pool.js'

const router = Router()

// GET /api/slots/available -> Fetch slots that aren't booked yet
router.get('/available', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ts.*, u.name as volunteer_name 
       FROM time_slots ts 
       JOIN users u ON ts.volunteer_id = u.id 
       WHERE ts.status = 'available' AND ts.start_time > NOW()
       ORDER BY ts.start_time ASC`,
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database fetch failed' })
  }
})

// POST /api/slots -> Volunteer creates a new availability window
router.post('/', async (req, res) => {
  const { volunteer_id, start_time, end_time, is_recurring, minimum_notice_hours } = req.body

  try {
    // 1. required fields validation
    if (!volunteer_id || !start_time || !end_time) {
      return res.status(400).json({
        error: 'volunteer_id, start_time, end_time are required',
      })
    }

    const start = new Date(start_time)
    const end = new Date(end_time)
    const now = new Date()

    // 2. validate date parsing
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
      })
    }

    // 3. end must be after start
    if (end <= start) {
      return res.status(400).json({
        error: 'end_time must be after start_time',
      })
    }

    // 4. start must be in the future
    if (start <= now) {
      return res.status(400).json({
        error: 'start_time must be in the future',
      })
    }

    // 5. defaults
    const recurring = is_recurring ?? false
    const noticeHours = minimum_notice_hours ?? 24

    // 6. insert into DB
    const result = await pool.query(
      `INSERT INTO time_slots 
      (volunteer_id, start_time, end_time, is_recurring, minimum_notice_hours) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [volunteer_id, start, end, recurring, noticeHours],
    )

    return res.status(201).json(result.rows[0])
  } catch (err) {
    const fs = await import('fs')
    fs.appendFileSync(
      '/tmp/debug.log',
      `\n[${new Date().toISOString()}] POST /api/slots error:\n${String(err)}\n${(err as Error)?.stack}\n`,
    )
    return res.status(500).json({ error: 'Failed to save slot', details: String(err) })
  }
})

export default router
