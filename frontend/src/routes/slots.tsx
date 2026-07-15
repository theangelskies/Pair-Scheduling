import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import api from '../services/api'
import styles from './slots.module.css'

export const Route = createFileRoute('/slots')({
  component: SlotsPage,
})

type Slot = {
  id: number
  volunteer_name: string
  start_time: string
  end_time: string
  status: string
}

function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)

  async function loadSlots() {
    try {
      const data = await api.getAdminSlots()
      setSlots(data)
    } catch (err) {
      console.error(err)
      alert('Failed to load slots.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSlots()
  }, [])

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Are you sure you want to delete this slot?')

    if (!confirmed) return

    try {
      await api.deleteAdminSlot(id)

      setSlots((prev) => prev.filter((slot) => slot.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete slot.')
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading slots...</div>
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Slot Management</h1>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Volunteer</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {slots.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No slots found.
                </td>
              </tr>
            ) : (
              slots.map((slot) => (
                <tr key={slot.id}>
                  <td>{slot.volunteer_name}</td>

                  <td>{new Date(slot.start_time).toLocaleString()}</td>

                  <td>{new Date(slot.end_time).toLocaleString()}</td>

                  <td>
                    <span className={styles.status}>{slot.status}</span>
                  </td>

                  <td>
                    <button className={styles.deleteBtn} onClick={() => void handleDelete(slot.id)}>
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

export default SlotsPage
