import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
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
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        const email = data.session.user.email

        // Get the role selected on the login page before Google redirect
        const requestedRole = consumePendingRole()

        const ADMIN_EMAILS = [
          "2563149075@qq.com",
          "angelskiesbiz@gmail.com",
          "ourpairscheduling@gmail.com"
       ];

        // Handle administrator login
        if (requestedRole === 'admin') {
          if (!ADMIN_EMAILS.includes(email)) {
            await supabase.auth.signOut()

            setError(
              'You are not authorized as an administrator.'
            )

            return
          }
          saveCurrentUser({
            id: -1,
            name: 'Administrator',
            email,
            role: 'admin',
          })

          // Redirect authorized admin users
          void navigate({ to: '/' })
          return
        }

        const user = await loadCurrentUser(email)

        if (isOnboardingResponse(user)) {
          // The selected role from login page is used to automatically
          // create the user's profile after first Google login.
          if (requestedRole) {
            try {
              const created = await api.createProfile({
                role: requestedRole,
              })

              if (created.user) {
                saveCurrentUser(created.user)

                goToRoleHome(
                  navigate,
                  created.user.role
                )

                return
              }
            } catch {
              // Continue to manual onboarding if profile creation fails
            }
          }

          void navigate({ to: '/onboarding' })
          return
        }

        // Existing users go directly to their role homepage
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