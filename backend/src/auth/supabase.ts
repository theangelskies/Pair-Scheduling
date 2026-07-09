import type { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { pool } from '../db/pool.js'

type AuthUser = {
  id: string
  email?: string
}

type UserProfile = {
  id: number
  supabaseId: string
  email: string | null
  name: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
      profile?: UserProfile
    }
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getSupabaseProject() {
  if (process.env.SUPABASE_PROJECT) return process.env.SUPABASE_PROJECT
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF

  if (process.env.SUPABASE_URL) {
    return new URL(process.env.SUPABASE_URL).hostname.split('.')[0]
  }

  return null
}

function getJwks() {
  if (jwks) return jwks

  const project = getSupabaseProject()
  if (!project) {
    throw new Error('SUPABASE_PROJECT or SUPABASE_URL is required for JWT verification')
  }

  jwks = createRemoteJWKSet(
    new URL(`https://${project}.supabase.co/auth/v1/.well-known/jwks.json`),
  )
  return jwks
}

function readBearerToken(req: Request) {
  const authorization = req.header('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) return null
  return token
}

function readEmail(payload: JWTPayload) {
  return typeof payload.email === 'string' ? payload.email : undefined
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readBearerToken(req)

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const project = getSupabaseProject()
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: project ? `https://${project}.supabase.co/auth/v1` : undefined,
    })

    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = {
      id: payload.sub,
      email: readEmail(payload),
    }

    return next()
  } catch (err) {
    console.error('JWT verification failed:', err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function findProfileForAuthUser(user: AuthUser) {
  const { rows } = await pool.query(
    `SELECT id, supabase_id, email, name, role
     FROM users
     WHERE supabase_id = $1 OR (supabase_id IS NULL AND email = $2)
     ORDER BY supabase_id NULLS LAST
     LIMIT 1`,
    [user.id, user.email ?? null],
  )

  const profile = rows[0]
  if (!profile) return null

  if (!profile.supabase_id) {
    const updated = await pool.query(
      `UPDATE users
       SET supabase_id = $1
       WHERE id = $2
       RETURNING id, supabase_id, email, name, role`,
      [user.id, profile.id],
    )
    return toUserProfile(updated.rows[0])
  }

  return toUserProfile(profile)
}

export async function requireProfile(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const profile = await findProfileForAuthUser(req.user)

    if (!profile) {
      return res.json({ needsOnboarding: true, email: req.user.email })
    }

    req.profile = profile
    return next()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to load user profile' })
  }
}

function toUserProfile(row: {
  id: number
  supabase_id: string
  email: string | null
  name: string
  role: string
}): UserProfile {
  return {
    id: row.id,
    supabaseId: row.supabase_id,
    email: row.email,
    name: row.name,
    role: row.role,
  }
}
