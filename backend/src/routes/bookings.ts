import { Router } from 'express'
import { pool } from '../db/pool.js'
import { createCalendarEvent, deleteCalendarEvent } from '../services/calendarService.js'
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from '../services/emailService.js'

const router = Router()

// POST /api/bookings -> Trainee books an available slot
router.post('/', async (req, res) => {
  const { slotId, traineeId, agenda } = req.body

  if (!slotId || !traineeId) {
    return res.status(400).json({ error: 'slotId and traineeId are required' })
  }

  try {
    const slotResult = await pool.query('SELECT * FROM time_slots WHERE id = $1', [slotId])
    const slot = slotResult.rows[0]

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' })
    }
    if (slot.status !== 'available') {
      return res.status(409).json({ error: 'Slot is no longer available' })
    }

    const volunteerResult = await pool.query('SELECT * FROM users WHERE id = $1', [
      slot.volunteer_id,
    ])
    const volunteer = volunteerResult.rows[0]

    const traineeResult = await pool.query('SELECT * FROM users WHERE id = $1', [traineeId])
    const trainee = traineeResult.rows[0]

    await pool.query('UPDATE time_slots SET status = $1 WHERE id = $2', ['booked', slot.id])

    const { googleEventId, meetLink } = await createCalendarEvent({
      startTime: slot.start_time,
      endTime: slot.end_time,
      volunteer: { email: volunteer.email, name: volunteer.name },
      trainee: { email: trainee.email, name: trainee.name },
    })

    const bookingResult = await pool.query(
      `INSERT INTO bookings (slot_id, trainee_id, google_event_id, google_meet_link, agenda)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [slot.id, traineeId, googleEventId, meetLink, agenda ?? null],
    )

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
    console.error(err)
    return res.status(500).json({ error: 'Failed to create booking' })
  }
})

// PATCH /api/bookings/:id/cancel -> Volunteer, trainee, or admin cancels a booking
router.patch('/:id/cancel', async (req, res) => {
  const { userId } = req.body

  try {
    const bookingResult = await pool.query(
      `SELECT b.id, b.slot_id, b.trainee_id, b.google_event_id, b.status,
              ts.volunteer_id, ts.start_time, ts.end_time,
              v.name AS volunteer_name, v.email AS volunteer_email,
              t.name AS trainee_name, t.email AS trainee_email
       FROM bookings b
       JOIN time_slots ts ON b.slot_id = ts.id
       JOIN users v ON v.id = ts.volunteer_id
       JOIN users t ON t.id = b.trainee_id
       WHERE b.id = $1`,
      [req.params.id],
    )
    const booking = bookingResult.rows[0]

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId])
    const requestingUser = userResult.rows[0]

    const isVolunteer = userId === booking.volunteer_id
    const isTrainee = userId === booking.trainee_id
    const isAdmin = requestingUser?.role === 'admin'

    if (!isVolunteer && !isTrainee && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' })
    }

    await deleteCalendarEvent(booking.google_event_id)

    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', booking.id])
    await pool.query('UPDATE time_slots SET status = $1 WHERE id = $2', [
      'available',
      booking.slot_id,
    ])

    await sendBookingCancellationEmail({
      volunteer: { email: booking.volunteer_email, name: booking.volunteer_name },
      trainee: { email: booking.trainee_email, name: booking.trainee_name },
      startTime: booking.start_time,
      endTime: booking.end_time,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to cancel booking' })
  }
})

export default router
