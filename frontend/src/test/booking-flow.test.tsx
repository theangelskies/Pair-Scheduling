import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { Route } from '../routes/trainee'
import api from '../services/api'
vi.mock('../services/api', () => ({
  default: {
    getAvailableSlots: vi.fn(),
  },
}))
describe('booking flow', () => {
  it('loads available slots', async () => {
    vi.mocked(api.getAvailableSlots).mockResolvedValue([
      {
        id: 1,
        volunteer_name: 'Alice García',
        start_time: '2026-07-25T13:00:00.000Z',
      },
    ])

    render(<Route.options.component />)

    await waitFor(() => {
      expect(screen.getByText(/Alice García/i)).toBeInTheDocument()
    })
  })
    it('shows a message when there are no available slots', async () => {
    vi.mocked(api.getAvailableSlots).mockResolvedValue([])

    render(<Route.options.component />)

    await waitFor(() => {
      expect(screen.getByText(/No available slots/i)).toBeInTheDocument()
    })
  })
})