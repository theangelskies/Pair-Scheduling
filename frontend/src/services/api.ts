import axios from 'axios'
import { supabase } from './supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})
export const api = {
  createProfile: async (profileData: { role: 'trainee' | 'volunteer' }) => {
    const response = await apiClient.post('/profile/create', profileData)
    return response.data
  },

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
  getMySlots: async (volunteerId: number) => {
    const response = await apiClient.get('/slots/mine', { params: { volunteerId } })
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
  createBooking: async (slotId: number, traineeId: number, agenda?: string) => {
    const response = await apiClient.post('/bookings', { slotId, traineeId, agenda })
    return response.data
  },
  getMyBookings: async (traineeId: number) => {
    const response = await apiClient.get('/bookings', { params: { traineeId } })
    return response.data
  },
  cancelBooking: async (bookingId: number, userId: number) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/cancel`, { userId })
    return response.data
  },
}

export default api
