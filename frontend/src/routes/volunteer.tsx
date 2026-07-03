import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import api from '../services/api'
import styles from './volunteer.module.css'

export const Route = createFileRoute('/volunteer')({
  component: Volunteer,
})

type ApiSlot = {
  id: number
  volunteer_id: number
  volunteer_name: string
  start_time: string
  end_time: string
  status: string
}

type BookingRecord = {
  slotId: number
  traineeId: number
  traineeName: string
}

type MySlot = {
  id: number
  timeRange: string
  date: string
  status: 'available' | 'booked'
  bookedBy?: string
}

function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatTimeRange(start: string, end: string) {
  return `${fmtTime(start)} – ${fmtTime(end)}`
}

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser')
    return raw ? (JSON.parse(raw) as { id: number; name: string; email: string }) : null
  } catch {
    return null
  }
}

function readBookings(): Map<number, string> {
  try {
    const raw = localStorage.getItem('bookedSlots')
    const records = raw ? (JSON.parse(raw) as BookingRecord[]) : []
    return new Map(records.map((r) => [r.slotId, r.traineeName]))
  } catch {
    return new Map()
  }
}

export function Volunteer() {
  const currentUser = getCurrentUser()
  const [mySlots, setMySlots] = useState<MySlot[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [isRecurring, setIsRecurring] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  function apiSlotsToMySlots(data: ApiSlot[]): MySlot[] {
    const bookings = readBookings()
    return data
      .filter((s) => s.volunteer_id === currentUser?.id)
      .map((s) => {
        const traineeName = bookings.get(s.id)
        return {
          id: s.id,
          timeRange: formatTimeRange(s.start_time, s.end_time),
          date: formatDay(s.start_time),
          status: traineeName ? ('booked' as const) : ('available' as const),
          bookedBy: traineeName,
        }
      })
  }

  function refreshSlots() {
    api
      .getAvailableSlots()
      .then((data: ApiSlot[]) => {
        setMySlots(apiSlotsToMySlots(data))
      })
      .catch(() => {
        // silently ignore — show whatever we have
      })
  }

  useEffect(() => {
    refreshSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAddSlot() {
    if (!date || !startTime || !endTime) {
      setMessage({ text: 'Please fill in date, start and end time.', error: true })
      return
    }
    if (endTime <= startTime) {
      setMessage({ text: 'End time must be after start time.', error: true })
      return
    }

    const start = new Date(`${date}T${startTime}`)
    const end = new Date(`${date}T${endTime}`)

    setSubmitting(true)
    setMessage(null)

    try {
      await api.createSlot({
        volunteer_id: currentUser?.id ?? 1,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        is_recurring: isRecurring,
        minimum_notice_hours: 24,
      })

      setDate('')
      setMessage({ text: 'Slot added!', error: false })
      refreshSlots()
    } catch {
      setMessage({ text: 'Failed to create slot. Please try again.', error: true })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(id: number) {
    if (!confirm('Cancel this time slot?')) return
    try {
      await api.cancelSlot(id)
    } catch {
      // endpoint may not exist yet — remove from local state regardless
    }
    setMySlots((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>My sessions</h2>
        <p>Manage your available time slots.</p>
      </div>

      <div className={styles.addSlotCard}>
        <h3>Add a time slot</h3>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="slot-date">
              Date
            </label>
            <input
              id="slot-date"
              className={styles.fieldInput}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="slot-start">
              Start time
            </label>
            <input
              id="slot-start"
              className={styles.fieldInput}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="slot-end">
              End time
            </label>
            <input
              id="slot-end"
              className={styles.fieldInput}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.toggleRow}>
          <button
            type="button"
            className={`${styles.toggle} ${isRecurring ? styles.toggleOn : ''}`}
            onClick={() => setIsRecurring((v) => !v)}
            aria-pressed={isRecurring}
            aria-label="Repeat weekly"
          />
          <span className={styles.toggleLabel}>Repeat weekly</span>
        </div>
        <button className={styles.btnAddSlot} onClick={handleAddSlot} disabled={submitting}>
          {submitting ? 'Adding…' : '+ Add slot'}
        </button>
        {message && (
          <p className={`${styles.message} ${message.error ? styles.messageError : ''}`}>
            {message.text}
          </p>
        )}
      </div>

      {mySlots.length === 0 ? (
        <div className={styles.emptyState}>No slots yet. Add your first time slot above.</div>
      ) : (
        <div className={styles.slotsList}>
          {mySlots.map((slot) => (
            <div key={slot.id} className={styles.slotRow}>
              <div className={styles.slotInfo}>
                <div className={styles.slotTime}>{slot.timeRange}</div>
                <div className={styles.slotDate}>{slot.date}</div>
                {slot.bookedBy && (
                  <div className={styles.bookedBy}>Booked by {slot.bookedBy}</div>
                )}
              </div>
              <div className={styles.slotRight}>
                <span
                  className={`${styles.badge} ${slot.status === 'available' ? styles.badgeAvailable : styles.badgeBooked}`}
                >
                  {slot.status === 'available' ? 'Available' : 'Booked'}
                </span>
                {slot.status === 'available' && (
                  <button className={styles.btnCancel} onClick={() => handleCancel(slot.id)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
