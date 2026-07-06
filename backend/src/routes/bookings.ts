import { Router } from 'express'
import { pool } from '../db/pool.js'
import { createMeetingLink } from '../services/calendarService.js'
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from '../services/emailService.js'

const router = Router()

// POST /api/bookings -> Trainee books an available slot
router.post('/', async (req, res) => {
  const { slotId, traineeId, agenda } = req.body

  if (!slotId || !traineeId) {
    return res.status(400).json({ error: 'slotId and traineeId are required' })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const slotResult = await client.query('SELECT * FROM time_slots WHERE id = $1 FOR UPDATE', [
      slotId,
    ])
    const slot = slotResult.rows[0]

    if (!slot) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Slot not found' })
    }
    if (slot.status !== 'available') {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Slot is no longer available' })
    }

    const volunteerResult = await client.query('SELECT * FROM users WHERE id = $1', [
      slot.volunteer_id,
    ])
    const volunteer = volunteerResult.rows[0]

    const traineeResult = await client.query('SELECT * FROM users WHERE id = $1', [traineeId])
    const trainee = traineeResult.rows[0]

    await client.query('UPDATE time_slots SET status = $1 WHERE id = $2', ['booked', slot.id])

    const { meetLink } = createMeetingLink()

    const bookingResult = await client.query(
      `INSERT INTO bookings (slot_id, trainee_id, meet_link, agenda)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [slot.id, traineeId, meetLink, agenda ?? null],
    )

    await client.query('COMMIT')

    await sendBookingConfirmationEmail({
      volunteer: { email: volunteer.email, name: volunteer.name },
      trainee: { email: trainee.email, name: trainee.name },
      startTime: slot.start_time,
      endTime: slot.end_time,
      meetLink,
    })

    return res.status(201).json({
      bookingId: bookingResult.rows[0].id,
      meetLink,
      slot: {
        startTime: slot.start_time,
        endTime: slot.end_time,
        volunteer: { id: volunteer.id, name: volunteer.name, email: volunteer.email },
      },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Failed to create booking' })
  } finally {
    client.release()
  }
})

// PATCH /api/bookings/:id/cancel -> Volunteer, trainee, or admin cancels a booking
router.patch('/:id/cancel', async (req, res) => {
  const { userId } = req.body

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const bookingResult = await client.query(
      `SELECT b.id, b.slot_id, b.trainee_id, b.status,
              ts.volunteer_id, ts.start_time, ts.end_time,
              v.name AS volunteer_name, v.email AS volunteer_email,
              t.name AS trainee_name, t.email AS trainee_email
       FROM bookings b
       JOIN time_slots ts ON b.slot_id = ts.id
       JOIN users v ON v.id = ts.volunteer_id
       JOIN users t ON t.id = b.trainee_id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [req.params.id],
    )
    const booking = bookingResult.rows[0]

    if (!booking) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Booking not found' })
    }

    const userResult = await client.query('SELECT role FROM users WHERE id = $1', [userId])
    const requestingUser = userResult.rows[0]

    const isVolunteer = userId === booking.volunteer_id
    const isTrainee = userId === booking.trainee_id
    const isAdmin = requestingUser?.role === 'admin'

    if (!isVolunteer && !isTrainee && !isAdmin) {
      await client.query('ROLLBACK')
      return res.status(403).json({ error: 'Not authorized to cancel this booking' })
    }

    await client.query('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', booking.id])
    await client.query('UPDATE time_slots SET status = $1 WHERE id = $2', [
      'available',
      booking.slot_id,
    ])

    await client.query('COMMIT')

    await sendBookingCancellationEmail({
      volunteer: { email: booking.volunteer_email, name: booking.volunteer_name },
      trainee: { email: booking.trainee_email, name: booking.trainee_name },
      startTime: booking.start_time,
      endTime: booking.end_time,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ error: 'Failed to cancel booking' })
  } finally {
    client.release()
  }
})

export default router
