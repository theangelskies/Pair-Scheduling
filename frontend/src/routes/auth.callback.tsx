import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        void navigate({ to: '/trainee' })
        return
      }

      void navigate({ to: '/login' })
    }

    void checkSession()
  }, [navigate])

  return <p>Signing you in...</p>
}
