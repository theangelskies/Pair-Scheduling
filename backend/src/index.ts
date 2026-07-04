import express from 'express'
import { userRoutes } from './routes/users.js'
import { pool } from './db/pool.js'
import slotsRouter from './routes/slots.js'

const app = express()
const PORT: number = Number(process.env.PORT) || 3000

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json())

// Allow requests from the frontend (dev server by default, or FRONTEND_URL in production)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL)
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', '*')
  // res.setHeader('Referer-Policy', 'no-referrer')
  next()
})

// Never let the browser cache API responses — avoids stale data after DB resets
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// ── Routes ──────────────────────────────────────────────────────────────────
// Mount route files here. Keep index.ts clean – one line per feature.
app.use('/api/users', userRoutes)

app.use('/api/slots', slotsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
  // Check DB connection on startup
  try {
    const client = await pool.connect()
    console.log('🐘 PostgreSQL connected')
    client.release()
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err)
  }
})

export default app
