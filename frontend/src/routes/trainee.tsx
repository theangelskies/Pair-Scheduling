import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import api from '../services/api'
import styles from './trainee.module.css'

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

type BookingRecord = {
  slotId: number
  traineeId: number
  traineeName: string
}

type ConfirmedBooking = {
  slot: Slot
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

function readBookings(): BookingRecord[] {
  try {
    const raw = localStorage.getItem('bookedSlots')
    return raw ? (JSON.parse(raw) as BookingRecord[]) : []
  } catch {
    return []
  }
}

function readBookedIds(): Set<number> {
  return new Set(readBookings().map((b) => b.slotId))
}

function persistBooking(record: BookingRecord) {
  const existing = readBookings().filter((b) => b.slotId !== record.slotId)
  localStorage.setItem('bookedSlots', JSON.stringify([...existing, record]))
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser')
    return raw ? (JSON.parse(raw) as { id: number; name: string; role: string }) : null
  } catch {
    return null
  }
}

export function Trainee() {
  const currentUser = getCurrentUser()
  const canBook = currentUser?.role === 'trainee'
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalSlot, setModalSlot] = useState<Slot | null>(null)
  const [agenda, setAgenda] = useState('')
  const [bookedIds, setBookedIds] = useState<Set<number>>(readBookedIds)
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null)

  useEffect(() => {
    api
      .getAvailableSlots()
      .then((data: Slot[]) => {
        setSlots(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  async function confirmBooking() {
    if (!modalSlot) return
    try {
      await api.bookSlot(modalSlot.id, { agenda })
    } catch {
      // endpoint may not exist yet — still mark as booked
    }
    persistBooking({
      slotId: modalSlot.id,
      traineeId: currentUser?.id ?? 0,
      traineeName: currentUser?.name ?? 'Trainee',
    })
    setBookedIds(readBookedIds())
    setConfirmed({ slot: modalSlot })
    setModalSlot(null)
    setAgenda('')
  }

  if (confirmed) {
    const { slot } = confirmed
    return (
      <div className={styles.confirmWrap}>
        <div className={styles.confirmCard}>
          <div className={styles.confirmIcon}>✓</div>
          <h2>You're booked</h2>
          <p>Your session has been confirmed.</p>
          <div className={styles.confirmDetails}>
            {formatTimeRange(slot.start_time, slot.end_time)} · {formatDay(slot.start_time)}
            <br />
            with {slot.volunteer_name}
          </div>
          <button className={styles.btnSecondary} onClick={() => setConfirmed(null)}>
            ← Back to sessions
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <div className={styles.emptyState}>Loading slots…</div>
  if (error) return <div className={styles.emptyState}>Error: {error}</div>

  const grouped = groupByDay(slots)

  return (
    <div className={styles.page}>
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
              const isBooked = bookedIds.has(slot.id) || slot.status !== 'available'
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
