import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import styles from './__root.module.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function useCurrentUser() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(() => {
    try {
      const raw = localStorage.getItem('currentUser')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    function syncUser() {
      try {
        const raw = localStorage.getItem('currentUser')
        setUser(raw ? JSON.parse(raw) : null)
      } catch {
        setUser(null)
      }
    }

    function onStorage(e: StorageEvent) {
      if (e.key === 'currentUser') {
        syncUser()
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('currentUserChanged', syncUser)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('currentUserChanged', syncUser)
    }
  }, [])

  return { user, setUser }
}

function RootLayout() {
  const navigate = useNavigate()
  const { user, setUser } = useCurrentUser()

  function handleSignOut() {
    localStorage.removeItem('currentUser')
    setUser(null)
    void navigate({ to: '/login' })
  }

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/" activeProps={{ className: styles.navLinkActive }} className={styles.navLink}>
          Home
        </Link>
        <Link
          to="/about"
          activeProps={{ className: styles.navLinkActive }}
          className={styles.navLink}
        >
          About
        </Link>
        <Link
          to="/users"
          activeProps={{ className: styles.navLinkActive }}
          className={styles.navLink}
        >
          Users
        </Link>
        <Link
          to="/trainee"
          activeProps={{ className: styles.navLinkActive }}
          className={styles.navLink}
        >
          Trainee
        </Link>
        <Link
          to="/volunteer"
          activeProps={{ className: styles.navLinkActive }}
          className={styles.navLink}
        >
          Volunteer
        </Link>
        <Link
          to="/login"
          activeProps={{ className: styles.navLinkActive }}
          className={styles.navLink}
        >
          Login
        </Link>

        {user && (
          <div className={styles.userBadge}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{user.role}</span>
            <button className={styles.signOutBtn} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
