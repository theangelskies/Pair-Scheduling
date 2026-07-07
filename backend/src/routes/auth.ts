import { Router } from 'express'
import passport from 'passport'

const router = Router()

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
    failureRedirect: 'http://localhost:5173/login',
  }),
  (req, res) => {
    const role = req.query.state

    if (role === 'volunteer') {
      res.redirect('http://localhost:5173/volunteer')
      return
    }

    res.redirect('http://localhost:5173/trainee')
  },
)

export default router