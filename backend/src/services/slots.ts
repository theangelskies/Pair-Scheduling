import { pool } from '../db/pool.js'

export type Slot = {
  id: number
  volunteer_id: number
  start_time: string
  end_time: string
  is_recurring: boolean
  minimum_notice_hours: number
  status: string
  volunteer_name: string
}

export async function getAvailableSlots(): Promise<Slot[]> {
  const { rows } = await pool.query(
    `SELECT ts.*, u.name as volunteer_name
     FROM time_slots ts
     JOIN users u ON ts.volunteer_id = u.id
     WHERE ts.status = 'available' AND ts.start_time > NOW()
     ORDER BY ts.start_time ASC`,
  )
  return rows
}
