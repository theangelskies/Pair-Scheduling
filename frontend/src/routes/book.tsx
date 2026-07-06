import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../services/api'
import styles from './book.module.css'

export const Route = createFileRoute('/book')({
  component: BookConfirmation,
  validateSearch: (
    search: Record<string, unknown>,
  ): { slotId: number; traineeId: number; agenda?: string } => ({
    slotId: Number(search.slotId),
    traineeId: Number(search.traineeId),
    agenda: typeof search.agenda === 'string' ? search.agenda : undefined,
  }),
})

type BookingState =
  | { status: 'loading' }
  | { status: 'success'; meetLink: string }
  | { status: 'conflict' }
  | { status: 'error'; message: string }

function BookConfirmation() {
  const { slotId, traineeId, agenda } = Route.useSearch()
  const [state, setState] = useState<BookingState>({ status: 'loading' })

  useEffect(() => {
    if (!slotId || !traineeId) {
      setState({ status: 'error', message: 'Missing slot or trainee information.' })
      return
    }

    let cancelled = false

    api
      .createBooking(slotId, traineeId, agenda)
      .then((data: { meetLink: string }) => {
        if (!cancelled) setState({ status: 'success', meetLink: data.meetLink })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          setState({ status: 'conflict' })
        } else {
          setState({
            status: 'error',
            message: 'Something went wrong while booking this session.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [slotId, traineeId, agenda])

  if (state.status === 'loading') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <p>Booking your session…</p>
        </div>
      </div>
    )
  }

  if (state.status === 'success') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={`${styles.icon} ${styles.iconSuccess}`}>✓</div>
          <h2>You're booked</h2>
          <p>A Jitsi Meet link has been sent to both of you.</p>
          <div className={styles.meetLinkBox}>
            <div className={styles.meetLinkLabel}>Jitsi Meet link</div>
            <a href={state.meetLink} target="_blank" rel="noreferrer">
              {state.meetLink}
            </a>
          </div>
          <Link to="/trainee" className={styles.btnSecondary}>
            ← Back to sessions
          </Link>
        </div>
      </div>
    )
  }

  if (state.status === 'conflict') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={`${styles.icon} ${styles.iconError}`}>!</div>
          <h2>This slot is no longer available</h2>
          <p>Someone else booked it just before you. Please pick another time.</p>
          <Link to="/trainee" className={styles.btnSecondary}>
            ← Back to sessions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={`${styles.icon} ${styles.iconError}`}>!</div>
        <h2>Booking failed</h2>
        <p>{state.message}</p>
        <Link to="/trainee" className={styles.btnSecondary}>
          ← Back to sessions
        </Link>
      </div>
    </div>
  )
}
