import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import api from '../services/api'
import styles from './users.module.css'

export const Route = createFileRoute('/users')({
  component: UsersPage,
})

type User = {
  id: number
  name: string
  role: 'volunteer' | 'trainee'
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  async function loadUsers() {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (err) {
      console.error(err)
      alert('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  async function handleRoleChange(
    id: number,
    role: 'volunteer' | 'trainee',
  ) {
    try {
      await api.updateUserRole(id, role)

      setUsers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, role } : user,
        ),
      )
    } catch (err) {
      console.error(err)
      alert('Failed to update role.')
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this user?',
    )

    if (!confirmed) return

    try {
      await api.deleteUser(id)

      setUsers((prev) =>
        prev.filter((user) => user.id !== id),
      )
    } catch (err) {
      console.error(err)
      alert('Failed to delete user.')
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading users...
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>
        User Management
      </h1>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className={styles.empty}
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>

                  <td>
                    <select
                      className={styles.select}
                      value={user.role}
                      onChange={(e) =>
                        void handleRoleChange(
                          user.id,
                          e.target.value as
                            | 'volunteer'
                            | 'trainee',
                        )
                      }
                    >
                      <option value="volunteer">
                        Volunteer
                      </option>

                      <option value="trainee">
                        Trainee
                      </option>
                    </select>
                  </td>

                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() =>
                        void handleDelete(user.id)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UsersPage