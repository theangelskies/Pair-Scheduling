import { createFileRoute } from '@tanstack/react-router'
import styles from './login.module.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

export const Route = createFileRoute('/login')({
  component: Login,
})

export function Login() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h2>Sign in</h2>
        <p>Choose how you want to continue.</p>

        <a href={`${SERVER_ORIGIN}/auth/google?role=trainee`}>
          <button className={styles.btnPrimary} type="button">
            Log in as Trainee
          </button>
        </a>

        <a href={`${SERVER_ORIGIN}/auth/google?role=volunteer`}>
          <button className={styles.btnPrimary} type="button">
            Log in as Volunteer
          </button>
        </a>
      </div>
    </div>
  )
}
