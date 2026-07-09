import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import api from '../services/api'
import {
  getStoredUser,
  isOnboardingResponse,
  loadCurrentUser,
  type AppUser,
} from '../services/profile'
import styles from './trainee.module.css'
import { useAuth } from '../context/AuthContext'
export const Route = createFileRoute('/trainee')({
  component: Trainee,
})

type Slot = {
  id: number
  volunteer_name: string
  start_time: string
  end_time: string
  status: string
}

type Booking = {
  bookingId: number
  meetLink: string | null
  agenda: string | null
  startTime: string
  endTime: string
  volunteer: { id: number; name: string; email: string }
}

function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatTimeRange(start: string, end: string) {
  return `${fmtTime(start)} – ${fmtTime(end)}`
}

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function groupByDay(slots: Slot[]): [string, Slot[]][] {
  const map = new Map<string, Slot[]>()
  for (const slot of slots) {
    const key = formatDay(slot.start_time)
    const group = map.get(key) ?? []
    group.push(slot)
    map.set(key, group)
  }
  return Array.from(map.entries())
}

export function Trainee() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getStoredUser())
  const canBook = currentUser?.role === 'trainee'
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalSlot, setModalSlot] = useState<Slot | null>(null)
  const [agenda, setAgenda] = useState('')
  const [myBookings, setMyBookings] = useState<Booking[]>([])

  function refreshSlots() {
    api
      .getAvailableSlots()
      .then((data: Slot[] | unknown) => {
        if (isOnboardingResponse(data)) {
          void navigate({ to: '/onboarding' })
          return
        }

        if (!Array.isArray(data)) {
          setError('Could not load slots.')
          setLoading(false)
          return
        }

        setSlots(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }

  function refreshBookings() {
    if (!currentUser) return
    api
      .getMyBookings(currentUser.id)
      .then((data: Booking[]) => setMyBookings(data))
      .catch(() => {
        // silently ignore — show whatever we have
      })
  }

  useEffect(() => {
    if (!authLoading && !session) {
      void navigate({ to: '/login' })
      return
    }

    if (!authLoading && session && !currentUser) {
      loadCurrentUser(session.user.email)
        .then((user) => {
          if (isOnboardingResponse(user)) {
            void navigate({ to: '/onboarding' })
            return
          }

          setCurrentUser(user)
        })
        .catch((err: Error) => {
          setError(err.message)
          setLoading(false)
        })
    }
  }, [authLoading, currentUser, session, navigate])

  useEffect(() => {
    if (!session || !currentUser) return
    refreshBookings()
    refreshSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentUser])

  async function handleCancelBooking(bookingId: number) {
    if (!currentUser || !confirm('Cancel this booking?')) return
    try {
      await api.cancelBooking(bookingId, currentUser.id)
      refreshBookings()
      refreshSlots()
    } catch {
      // best-effort — leave the list as-is if the cancel failed
    }
  }

  function confirmBooking() {
    if (!modalSlot || !currentUser) return
    void navigate({
      to: '/book',
      search: {
        slotId: modalSlot.id,
        traineeId: currentUser.id,
        ...(agenda.trim() ? { agenda: agenda.trim() } : {}),
      },
    })
  }
  if (authLoading) {
    return <div className={styles.emptyState}>Checking sign in...</div>
  }
  if (loading) return <div className={styles.emptyState}>Loading slots…</div>
  if (error) return <div className={styles.emptyState}>Error: {error}</div>

  const grouped = groupByDay(slots)

  return (
    <div className={styles.page}>
      {myBookings.length > 0 && (
        <div className={styles.dayGroup}>
          <div className={styles.header}>
            <h2>My upcoming sessions</h2>
          </div>
          <div className={styles.slotsGrid}>
            {myBookings.map((booking) => (
              <div key={booking.bookingId} className={styles.slotCard}>
                <div>
                  <div className={styles.slotTime}>
                    {formatTimeRange(booking.startTime, booking.endTime)} ·{' '}
                    {formatDay(booking.startTime)}
                  </div>
                  <div className={styles.slotVol}>with {booking.volunteer.name}</div>
                  {booking.meetLink && (
                    <a href={booking.meetLink} target="_blank" rel="noreferrer">
                      {booking.meetLink}
                    </a>
                  )}
                </div>
                <div className={styles.slotRight}>
                  <span className={`${styles.badge} ${styles.badgeBooked}`}>Booked</span>
                  <button
                    className={styles.btnCancel}
                    onClick={() => handleCancelBooking(booking.bookingId)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h2>Available sessions</h2>
        <p>Pick a time that works for you.</p>
      </div>

      {grouped.length === 0 && (
        <div className={styles.emptyState}>No available slots right now.</div>
      )}

      {grouped.map(([day, daySlots]) => (
        <div key={day} className={styles.dayGroup}>
          <div className={styles.dayLabel}>{day}</div>
          <div className={styles.slotsGrid}>
            {daySlots.map((slot) => {
              const isBooked = slot.status !== 'available'
              return (
                <div
                  key={slot.id}
                  className={`${styles.slotCard} ${isBooked ? styles.booked : ''}`}
                >
                  <div>
                    <div className={styles.slotTime}>
                      {formatTimeRange(slot.start_time, slot.end_time)}
                    </div>
                    <div className={styles.slotVol}>with {slot.volunteer_name}</div>
                  </div>
                  <div className={styles.slotRight}>
                    <span
                      className={`${styles.badge} ${isBooked ? styles.badgeBooked : styles.badgeAvailable}`}
                    >
                      {isBooked ? 'Booked' : 'Available'}
                    </span>
                    {!isBooked && canBook && (
                      <button
                        className={styles.btnBook}
                        onClick={(e) => {
                          e.stopPropagation()
                          setModalSlot(slot)
                        }}
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {modalSlot && (
        <div
          role="presentation"
          className={styles.overlay}
          onClick={(e) => e.target === e.currentTarget && setModalSlot(null)}
          onKeyDown={(e) => e.key === 'Escape' && setModalSlot(null)}
        >
          <div className={styles.modal}>
            <h3>Confirm your booking</h3>
            <div className={styles.modalSlotInfo}>
              <strong>
                {formatTimeRange(modalSlot.start_time, modalSlot.end_time)} ·{' '}
                {formatDay(modalSlot.start_time)}
              </strong>
              <span>with {modalSlot.volunteer_name}</span>
            </div>
            <label className={styles.fieldLabel} htmlFor="booking-agenda">
              What would you like to work on? <em>(optional)</em>
            </label>
            <textarea
              id="booking-agenda"
              className={styles.textarea}
              placeholder="e.g. I'd like help with understanding how to debug"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className={styles.btnConfirm} onClick={confirmBooking}>
                Confirm booking
              </button>
              <button className={styles.btnCancelModal} onClick={() => setModalSlot(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
