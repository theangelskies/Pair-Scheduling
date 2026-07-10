import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { savePendingRole } from '../services/profile'
import styles from './login.module.css'

export const Route = createFileRoute('/login')({
  component: Login,
})

type Role = 'trainee' | 'volunteer'

export function Login() {
  const [message, setMessage] = useState('')
  const [redirecting, setRedirecting] = useState<Role | null>(null)

  async function loginWithGoogle(role: Role) {
    setMessage('')
    setRedirecting(role)
    savePendingRole(role)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setRedirecting(null)
      setMessage(error.message)
    }
    // On success the browser navigates away to Google, so there's nothing more to do here.
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h2>Sign in</h2>
        <p>Choose how you want to continue.</p>

        <button
          className={styles.btnPrimary}
          type="button"
          onClick={() => loginWithGoogle('trainee')}
          disabled={redirecting !== null}
        >
          {redirecting === 'trainee' ? 'Redirecting...' : 'Log in with Google as Trainee'}
        </button>

        <button
          className={styles.btnSecondary}
          type="button"
          onClick={() => loginWithGoogle('volunteer')}
          disabled={redirecting !== null}
        >
          {redirecting === 'volunteer' ? 'Redirecting...' : 'Log in with Google as Volunteer'}
        </button>

        {message && <p className={styles.error}>{message}</p>}
      </div>
    </div>
  )
}
