import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { goToRoleHome, saveCurrentUser } from '../services/profile'
import styles from './login.module.css'

export const Route = createFileRoute('/onboarding')({
  component: Onboarding,
})

function Onboarding() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [role, setRole] = useState<'trainee' | 'volunteer'>('trainee')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: '/login' })
    }
  }, [loading, navigate, session])

  async function createProfile() {
    setMessage('')
    setSubmitting(true)

    try {
      const data = await api.createProfile({ role })
      if (data.user) {
        saveCurrentUser(data.user)
        goToRoleHome(navigate, data.user.role)
        return
      }

      goToRoleHome(navigate, role)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create your profile.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className={styles.wrap}>Checking sign in...</div>
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h2>Choose your role</h2>
        <p>{session?.user.email ?? 'Complete your profile to continue.'}</p>

        <div className={styles.roleToggle}>
          <button
            type="button"
            className={`${styles.roleOpt} ${role === 'trainee' ? styles.active : ''}`}
            onClick={() => setRole('trainee')}
          >
            Trainee
          </button>
          <button
            type="button"
            className={`${styles.roleOpt} ${role === 'volunteer' ? styles.active : ''}`}
            onClick={() => setRole('volunteer')}
          >
            Volunteer
          </button>
        </div>

        <button
          className={styles.btnPrimary}
          type="button"
          onClick={createProfile}
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Continue'}
        </button>

        {message && <p className={styles.error}>{message}</p>}
      </div>
    </div>
  )
}
