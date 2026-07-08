import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

// Google OAuth credentials aren't available in every environment (e.g. CI),
// and passport-google-oauth20 throws at construction time if clientID/clientSecret
// are empty — so only register the strategy when they're actually configured.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        return done(null, profile)
      },
    ),
  )
}

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user as Express.User)
})

export default passport
