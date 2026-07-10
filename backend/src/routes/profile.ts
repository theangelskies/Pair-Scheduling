import { Router } from 'express'
import { pool } from '../db/pool.js'
import { findProfileForAuthUser } from '../auth/supabase.js'

const router = Router()

router.post('/create', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const { role, name } = req.body

  if (typeof role !== 'string' || role.trim() === '') {
    return res.status(400).json({ error: 'role is required' })
  }

  const existingProfile = await findProfileForAuthUser(req.user)
  if (existingProfile) {
    return res.status(200).json({ needsOnboarding: false, user: existingProfile })
  }

  const email = req.user.email ?? null
  const profileName =
    typeof name === 'string' && name.trim() ? name.trim() : email?.split('@')[0] || 'New user'

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (supabase_id, email, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, supabase_id, email, name, role`,
      [req.user.id, email, profileName, role.trim()],
    )

    const user = rows[0]
    return res.status(201).json({
      needsOnboarding: false,
      user: {
        id: user.id,
        supabaseId: user.supabase_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to create profile' })
  }
})

export default router
