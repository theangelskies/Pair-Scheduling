import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Slots Management
  getAvailableSlots: async () => {
    const response = await apiClient.get('/slots/available');
    return response.data;
  },
  createSlot: async (slotData) => {
    const response = await apiClient.post('/slots', slotData);
    return response.data;
  },
  cancelSlot: async (slotId) => {
    const response = await apiClient.delete(`/slots/${slotId}`);
    return response.data;
  },

  // Booking Management
  bookSlot: async (slotId, bookingData) => {
    const response = await apiClient.post(`/slots/${slotId}/book`, bookingData);
    return response.data;
  }
};

export default api;