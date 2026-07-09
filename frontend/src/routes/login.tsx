import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import styles from './login.module.css'

export const Route = createFileRoute('/login')({
  component: Login,
})

export function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function sendMagicLink() {
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

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
        <p>Enter your email to receive a magic link.</p>

        <input
          className={styles.fieldInput}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button className={styles.btnPrimary} type="button" onClick={sendMagicLink}>
          Send magic link
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  )
}
