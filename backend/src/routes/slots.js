import { Router } from 'express'
import { pool } from '../db/pool.js' // Adjust path based on your template setup

const router = Router()

// GET /api/slots/available -> Fetch slots that aren't booked yet
router.get('/available', async (req, res) => {
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
