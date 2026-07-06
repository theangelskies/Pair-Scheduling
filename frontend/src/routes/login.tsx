import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import styles from './login.module.css'

export const Route = createFileRoute('/login')({
  component: Login,
})

type Role = 'trainee' | 'volunteer'

const DUMMY_USERS: { id: number; email: string; name: string; role: Role }[] = [
  { id: 3, email: 'carmen@example.com', name: 'Carmen Liu', role: 'trainee' },
  { id: 1, email: 'alice@example.com', name: 'Alice García', role: 'volunteer' },
  { id: 2, email: 'bob@example.com', name: 'Bob Mwangi', role: 'volunteer' },
  { id: 4, email: 'theangelskies@gmail.com', name: 'Volunteer Angela', role: 'volunteer' },
  { id: 5, email: 'onyekweluangela@gmail.com', name: 'Trainee Faith', role: 'trainee' },
]

export function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('trainee')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const hints = DUMMY_USERS.filter((u) => u.role === role)

  function handleSignIn() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    const match = DUMMY_USERS.find((u) => u.email === trimmed && u.role === role)
    if (!match) {
      setError(`No ${role} account found for that email.`)
      return
    }
    localStorage.setItem('currentUser', JSON.stringify(match))
    void navigate({ to: role === 'volunteer' ? '/volunteer' : '/trainee' })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h2>Sign in</h2>
        <p>Use one of the demo accounts below to get started.</p>

        <div className={styles.roleToggle}>
          <button
            className={`${styles.roleOpt} ${role === 'trainee' ? styles.active : ''}`}
            onClick={() => {
              setRole('trainee')
              setEmail('')
              setError('')
            }}
          >
            Trainee
          </button>
          <button
            className={`${styles.roleOpt} ${role === 'volunteer' ? styles.active : ''}`}
            onClick={() => {
              setRole('volunteer')
              setEmail('')
              setError('')
            }}
          >
            Volunteer
          </button>
        </div>

        <div className={styles.demoHint}>
          {hints.map((u) => (
            <button
              key={u.email}
              className={styles.demoUser}
              onClick={() => {
                setEmail(u.email)
                setError('')
              }}
            >
              <span className={styles.demoName}>{u.name}</span>
              <span className={styles.demoEmail}>{u.email}</span>
            </button>
          ))}
        </div>

        <label className={styles.fieldLabel} htmlFor="login-email">
          Email address
        </label>
        <input
          id="login-email"
          className={styles.fieldInput}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
        />
        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btnPrimary} onClick={handleSignIn}>
          Sign in
        </button>
      </div>
    </div>
  )
}
