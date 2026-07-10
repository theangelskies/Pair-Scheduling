import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { UserCard } from '../components/UserCard'
import { api } from '../services/api'
import { isOnboardingResponse } from '../services/profile'
import { useAuth } from '../context/AuthContext'

type User = { id: number; name: string; role: string }

// users.tsx → "/users"
// This page fetches data from the backend – a common real-world pattern.
export const Route = createFileRoute('/users')({
  component: UsersPage,
})

function UsersPage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!session) {
      void navigate({ to: '/login' })
      return
    }

    api
      .getUsers()
      .then((data: User[] | unknown) => {
        if (isOnboardingResponse(data)) {
          void navigate({ to: '/onboarding' })
          return
        }

        if (!Array.isArray(data)) {
          setError('Could not load users.')
          setLoading(false)
          return
        }

        setUsers(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [authLoading, session, navigate])

  if (authLoading) return <p>Checking sign in...</p>
  if (loading) return <p>Loading users…</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <h1>👥 Users</h1>
      <p>
        Fetched from <code>GET /api/users</code>
      </p>
      {users.map((user) => (
        <UserCard key={user.id} name={user.name} role={user.role} />
      ))}
    </div>
  )
}
