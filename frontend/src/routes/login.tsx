import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import styles from './login.module.css'

export const Route = createFileRoute('/login')({
  component: Login,
})

type Role = 'trainee' | 'volunteer'

export function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState<Role | null>(null)

  async function sendMagicLink(role: Role) {
    if (!email.trim()) {
      setMessage('Please enter your email address.')
      return
    }

    setMessage('')
    setSending(role)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role },
      },
    })

    setSending(null)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Check your email for the magic link.')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h2>Sign in</h2>
        <p>Enter your email, then choose how you want to continue.</p>

        <input
          className={styles.fieldInput}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button
          className={styles.btnPrimary}
          type="button"
          onClick={() => sendMagicLink('trainee')}
          disabled={sending !== null}
        >
          {sending === 'trainee' ? 'Sending...' : 'Log in as Trainee'}
        </button>

        <button
          className={styles.btnSecondary}
          type="button"
          onClick={() => sendMagicLink('volunteer')}
          disabled={sending !== null}
        >
          {sending === 'volunteer' ? 'Sending...' : 'Log in as Volunteer'}
        </button>

        {message && <p className={styles.error}>{message}</p>}
      </div>
    </div>
  )
}
