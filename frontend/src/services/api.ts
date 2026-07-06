import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const api = {
  // Users
  getUsers: async () => {
    const response = await apiClient.get('/users')
    return response.data
  },

  // Slots Management
  getAvailableSlots: async () => {
    const response = await apiClient.get('/slots/available')
    return response.data
  },
  createSlot: async (slotData: Record<string, unknown>) => {
    const response = await apiClient.post('/slots', slotData)
    return response.data
  },
  cancelSlot: async (slotId: number) => {
    const response = await apiClient.delete(`/slots/${slotId}`)
    return response.data
  },

  // Booking Management
  bookSlot: async (slotId: number, bookingData: Record<string, unknown>) => {
    const response = await apiClient.post(`/slots/${slotId}/book`, bookingData)
    return response.data
  },
  createBooking: async (slotId: number, traineeId: number) => {
    const response = await apiClient.post('/bookings', { slotId, traineeId })
    return response.data
  },
  cancelBooking: async (bookingId: number, userId: number) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/cancel`, { userId })
    return response.data
  },
}

export default api
