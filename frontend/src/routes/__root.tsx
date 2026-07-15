import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
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
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  const isAdmin = user?.role === 'admin'

  async function handleSignOut() {
    await supabase.auth.signOut()

    localStorage.removeItem('currentUser')

    setUser(null)
    closeMenu()
    void navigate({ to: '/login' })
  }

  return (
    <>
      <nav className={styles.nav}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
          <Link
            to="/"
            activeProps={{ className: styles.navLinkActive }}
            className={styles.navLink}
            onClick={closeMenu}
          >
            Home
          </Link>

          <Link
            to="/about"
            activeProps={{ className: styles.navLinkActive }}
            className={styles.navLink}
            onClick={closeMenu}
          >
            About
          </Link>

          {isAdmin ? (
            <>
              <Link
                to="/users"
                activeProps={{ className: styles.navLinkActive }}
                className={styles.navLink}
                onClick={closeMenu}
              >
                Users
              </Link>

              <Link
                to="/slots"
                activeProps={{ className: styles.navLinkActive }}
                className={styles.navLink}
                onClick={closeMenu}
              >
                Slots
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/trainee"
                activeProps={{ className: styles.navLinkActive }}
                className={styles.navLink}
                onClick={closeMenu}
              >
                Trainee
              </Link>

              <Link
                to="/volunteer"
                activeProps={{ className: styles.navLinkActive }}
                className={styles.navLink}
                onClick={closeMenu}
              >
                Volunteer
              </Link>
            </>
          )}

          {!user && (
            <Link
              to="/login"
              activeProps={{ className: styles.navLinkActive }}
              className={styles.navLink}
              onClick={closeMenu}
            >
              Login
            </Link>
          )}
        </div>

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
