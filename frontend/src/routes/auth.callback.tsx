import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { goToRoleHome, isOnboardingResponse, loadCurrentUser } from '../services/profile'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
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

  return <p>Signing you in...</p>
}
