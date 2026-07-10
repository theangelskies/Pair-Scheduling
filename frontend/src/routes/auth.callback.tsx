import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { goToRoleHome, isOnboardingResponse, loadCurrentUser } from '../services/profile'
import styles from './login.module.css'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function readHashError(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  const params = new URLSearchParams(hash)
  const description = params.get('error_description')
  if (description) return description.replace(/\+/g, ' ')
  return params.get('error')
}

function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hashError = readHashError()
    if (hashError) {
      setError(hashError)
      return
    }

    async function checkSession() {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        const user = await loadCurrentUser(data.session.user.email)

        if (isOnboardingResponse(user)) {
          void navigate({ to: '/onboarding' })
          return
        }

        goToRoleHome(navigate, user.role)
        return
      }

      void navigate({ to: '/login' })
    }

    void checkSession()
  }, [navigate])

  if (error) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h2>Sign in link expired</h2>
          <p>{error}</p>
          <Link to="/login" className={styles.btnPrimary}>
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p>Signing you in...</p>
      </div>
    </div>
  )
}
