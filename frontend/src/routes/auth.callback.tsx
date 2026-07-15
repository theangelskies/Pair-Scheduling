import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '../services/supabaseClient'
import api from '../services/api'
import {
  consumePendingRole,
  goToRoleHome,
  isOnboardingResponse,
  loadCurrentUser,
  saveCurrentUser,
} from '../services/profile'
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
      try {
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          const email = data.session.user.email
          const requestedRole = consumePendingRole()

          const ADMIN_EMAILS = [
            '2563149075@qq.com',
            'angelskiesbiz@gmail.com',
            'ourpairscheduling@gmail.com',
          ]

          // Administrator login
          if (requestedRole === 'admin') {
            if (!ADMIN_EMAILS.includes(email ?? '')) {
              await supabase.auth.signOut()

              setError('You are not authorized as an administrator.')
              return
            }

            saveCurrentUser({
              id: -1,
              name: 'Administrator',
              email,
              role: 'admin',
            })

            void navigate({ to: '/' })
            return
          }

          const user = await loadCurrentUser(email)

          if (isOnboardingResponse(user)) {
            if (requestedRole) {
              try {
                const created = await api.createProfile({
                  role: requestedRole,
                })

                if (created.user) {
                  saveCurrentUser(created.user)
                  goToRoleHome(navigate, created.user.role)
                  return
                }
              } catch {
                // fall through to manual onboarding
              }
            }

            void navigate({ to: '/onboarding' })
            return
          }

          goToRoleHome(navigate, user.role)
          return
        }

        void navigate({ to: '/login' })
      } catch (err) {
        console.error('Auth callback failed:', err)

        if (axios.isAxiosError(err)) {
          if (err.response) {
            const detail =
              typeof err.response.data?.error === 'string' ? err.response.data.error : undefined

            setError(
              `Sign-in request failed (${err.response.status}: ${err.response.statusText}).` +
                (detail ? ` ${detail}` : ''),
            )
          } else {
            setError(`Could not reach the server (${err.message}). Is the backend running?`)
          }

          return
        }

        setError(err instanceof Error ? err.message : 'Something went wrong while signing you in.')
      }
    }
    void checkSession()
  }, [navigate])

  if (error) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h2>Sign in failed</h2>

          <p>{error}</p>

          <Link
            to="/login"
            className={styles.btnPrimary}
            style={{
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
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
