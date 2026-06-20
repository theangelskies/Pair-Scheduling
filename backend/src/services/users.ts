import { pool } from '../db/pool.js'

// Define your data shapes as types or interfaces.
// Export them so routes and tests can import them.
export type User = {
  id: number
  name: string
  role: string
}

// Service functions talk to the database (or any data source).
// They return plain data – no req/res objects here.

export async function getAllUsers(): Promise<User[]> {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id')
  return rows
}

export async function getUserById(id: number): Promise<User | null> {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  return rows[0] ?? null
}
