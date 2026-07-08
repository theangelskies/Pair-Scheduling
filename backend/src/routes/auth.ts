import { Router } from 'express'
import passport from 'passport'

const router = Router()

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

router.get('/google', (req, res, next) => {
  const role = req.query.role

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: role === 'volunteer' ? 'volunteer' : 'trainee',
  })(req, res, next)
})

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  (req, res) => {
    const role = req.query.state

    if (role === 'volunteer') {
      res.redirect(`${FRONTEND_URL}/volunteer`)
      return
    }

    res.redirect(`${FRONTEND_URL}/trainee`)
  },
)

export default router
