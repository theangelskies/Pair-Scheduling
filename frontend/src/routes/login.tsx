import { createFileRoute } from '@tanstack/react-router'
import styles from './login.module.css'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h2>Sign in</h2>
        <p>Choose how you want to continue.</p>

       <a href="http://localhost:3000/auth/google?role=trainee">
          <button className={styles.btnPrimary} type="button">
            Log in as Trainee
          </button>
        </a>

       <a href="http://localhost:3000/auth/google?role=volunteer">
          <button className={styles.btnPrimary} type="button">
            Log in as Volunteer
          </button>
        </a>
      </div>
    </div>
  )
}
