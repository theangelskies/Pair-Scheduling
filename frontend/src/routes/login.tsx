import { createFileRoute } from '@tanstack/react-router'
import styles from './login.module.css'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
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
