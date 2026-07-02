import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import api from '../services/api'

export const Route = createFileRoute('/trainee')({
  component: RouteComponent,
})

function RouteComponent() {
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingMessage, setBookingMessage] = useState<string | null>(null)
  useEffect(() => {
    api
      .getAvailableSlots()
      .then((data) => {
        setSlots(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])
  if (loading) return <p>Loading slots...</p>

  if (error) return <p>Error: {error}</p>
  const handleBookSlot = async (slotId: number) => {
    setBookingMessage(`Booking request sent for slot ${slotId}`)
  }
  return (
    <div>
      <h1>Trainee Dashboard</h1>
      <p>Available mentoring sessions</p>

      {slots.length === 0 ? (
        <p>No available slots.</p>
      ) : (
        <ul>
          {slots.map((slot: any) => (
            <li key={slot.id}>
              {slot.volunteer_name} - {slot.start_time}
              <button type="button" onClick={() => handleBookSlot(slot.id)}>
                Book Slot
              </button>
            </li>
          ))}
        </ul>
      )}
      {bookingMessage && <p>{bookingMessage}</p>}
    </div>
  )
}
