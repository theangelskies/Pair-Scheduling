import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { Trainee } from '../routes/trainee'
import api from '../services/api'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { email: 'trainee@example.com' } },
    loading: false,
  }),
}))

vi.mock('../services/api', () => ({
  default: {
    getAvailableSlots: vi.fn(),
    getMyBookings: vi.fn(),
  },
}))

describe('booking flow', () => {
  beforeEach(() => {
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 1,
        name: 'Test Trainee',
        email: 'trainee@example.com',
        role: 'trainee',
      }),
    )
    vi.mocked(api.getMyBookings).mockResolvedValue([])
  })

  it('loads available slots', async () => {
    vi.mocked(api.getAvailableSlots).mockResolvedValue([
      {
        id: 1,
        volunteer_name: 'Alice García',
        start_time: '2026-07-25T13:00:00.000Z',
        end_time: '2026-07-25T14:00:00.000Z',
        status: 'available',
      },
    ])

    render(<Trainee />)

    await waitFor(() => {
      expect(screen.getByText(/Alice García/i)).toBeInTheDocument()
    })
  })
  it('shows a message when there are no available slots', async () => {
    vi.mocked(api.getAvailableSlots).mockResolvedValue([])

    render(<Trainee />)

    await waitFor(() => {
      expect(screen.getByText(/No available slots/i)).toBeInTheDocument()
    })
  })
})
