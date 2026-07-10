import { createFileRoute } from '@tanstack/react-router'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  getStoredUser,
  isOnboardingResponse,
  loadCurrentUser,
  type AppUser,
} from '../services/profile'
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
  trainee_name: string | null
  booking_id: number | null
}

type MySlot = {
  id: number
  timeRange: string
  date: string
  status: 'available' | 'booked'
  bookedBy?: string
  bookingId?: number
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

export function Volunteer() {
  const { session, loading: authLoading } = useAuth()
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getStoredUser())
  const canCreateSlot = currentUser?.role === 'volunteer'
  const [mySlots, setMySlots] = useState<MySlot[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [isRecurring, setIsRecurring] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  function apiSlotsToMySlots(data: ApiSlot[]): MySlot[] {
    return data.map((s) => ({
      id: s.id,
      timeRange: formatTimeRange(s.start_time, s.end_time),
      date: formatDay(s.start_time),
      status: s.status === 'available' ? ('available' as const) : ('booked' as const),
      bookedBy: s.trainee_name ?? undefined,
      bookingId: s.booking_id ?? undefined,
    }))
  }

  function refreshSlots() {
    if (!currentUser) return
    api
      .getMySlots(currentUser.id)
      .then((data: ApiSlot[] | unknown) => {
        if (isOnboardingResponse(data)) {
          window.location.href = '/onboarding'
          return
        }

        if (!Array.isArray(data)) {
          setMessage({ text: 'Could not load your slots.', error: true })
          return
        }

        setMySlots(apiSlotsToMySlots(data))
      })
      .catch(() => {
        // silently ignore — show whatever we have
      })
  }

  useEffect(() => {
    if (!authLoading && !session) {
      window.location.href = '/login'
      return
    }

    if (!authLoading && session && !currentUser) {
      loadCurrentUser(session.user.email)
        .then((user) => {
          if (isOnboardingResponse(user)) {
            window.location.href = '/onboarding'
            return
          }

          setCurrentUser(user)
        })
        .catch(() => {
          setMessage({ text: 'Could not load your profile. Please try again.', error: true })
        })
    }
  }, [authLoading, currentUser, session])

  useEffect(() => {
    if (!session || !currentUser) return
    refreshSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentUser])

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
    } catch (err) {
      const text =
        (axios.isAxiosError(err) && err.response?.data?.error) ||
        'Failed to create slot. Please try again.'
      setMessage({ text, error: true })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(slot: MySlot) {
    if (slot.status === 'booked') {
      if (!currentUser || !confirm('Cancel this booked session? The trainee will be notified.'))
        return
      try {
        await api.cancelBooking(slot.bookingId!, currentUser.id)
        refreshSlots()
      } catch {
        setMessage({ text: 'Could not cancel that booking. Please try again.', error: true })
      }
      return
    }

    if (!confirm('Cancel this time slot?')) return
    try {
      await api.cancelSlot(slot.id)
      setMySlots((prev) => prev.filter((s) => s.id !== slot.id))
    } catch {
      setMessage({
        text: 'Could not cancel that slot — it may already be booked.',
        error: true,
      })
      refreshSlots()
    }
  }

  if (authLoading) {
    return <div className={styles.page}>Checking sign in...</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>My sessions</h2>
        <p>Manage your available time slots.</p>
      </div>

      {canCreateSlot && (
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
      )}

      {mySlots.length === 0 ? (
        <div className={styles.emptyState}>No slots yet. Add your first time slot above.</div>
      ) : (
        <div className={styles.slotsList}>
          {mySlots.map((slot) => (
            <div key={slot.id} className={styles.slotRow}>
              <div className={styles.slotInfo}>
                <div className={styles.slotTime}>{slot.timeRange}</div>
                <div className={styles.slotDate}>{slot.date}</div>
                {slot.bookedBy && <div className={styles.bookedBy}>Booked by {slot.bookedBy}</div>}
              </div>
              <div className={styles.slotRight}>
                <span
                  className={`${styles.badge} ${slot.status === 'available' ? styles.badgeAvailable : styles.badgeBooked}`}
                >
                  {slot.status === 'available' ? 'Available' : 'Booked'}
                </span>
                <button className={styles.btnCancel} onClick={() => handleCancel(slot)}>
                  {slot.status === 'booked' ? 'Cancel booking' : 'Delete slot'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
