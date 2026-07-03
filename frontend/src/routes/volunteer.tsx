import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import api from '../services/api'

export const Route = createFileRoute('/volunteer')({
  component: Volunteer,
})

export function Volunteer() {
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    const slotData = {
      volunteer_id: Number(formData.get('volunteer_id')),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      is_recurring: false,
      minimum_notice_hours: 24,
    }

    try {
      await api.createSlot(slotData)
      setMessage('Slot created successfully!')
    } catch {
      setMessage('Failed to create slot. Please try again.')
    }
  }

  return (
    <div>
      <h1>Volunteer Dashboard</h1>
      <p>Create an available mentoring slot.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Volunteer ID
            <input name="volunteer_id" type="number" defaultValue="1" required />
          </label>
        </div>

        <div>
          <label>
            Start time
            <input name="start_time" type="datetime-local" required />
          </label>
        </div>

        <div>
          <label>
            End time
            <input name="end_time" type="datetime-local" required />
          </label>
        </div>

        <button type="submit">Create slot</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  )
}
