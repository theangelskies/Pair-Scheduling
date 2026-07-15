import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from '../services/users.js'

// Router files only handle HTTP concerns (parsing, status codes, responses).
// All business logic lives in services/.
export const userRoutes = Router()

userRoutes.get('/', async (_req, res) => {
  try {
    const users = await getAllUsers()
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

userRoutes.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(Number(req.params.id))
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// PATCH /api/users/:id -> Update a user's role
userRoutes.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { role } = req.body

    const user = await updateUserRole(id, role)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update user role' })
  }
})

// DELETE /api/users/:id -> Delete a user
userRoutes.delete('/:id', async (req, res) => {
  try {
    await deleteUser(Number(req.params.id))

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})
