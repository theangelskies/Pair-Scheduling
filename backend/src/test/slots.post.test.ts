import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../index.js'

describe('POST /api/slots', () => {
  it('should create a valid slot', async () => {
    // Far-future, randomized window so this doesn't collide with the many
    // slots this same integration test has accumulated for volunteer_id 1
    // over past runs (this test hits the real DB, not a mock).
    const daysOut = 60 + Math.floor(Math.random() * 300)
    const start = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)

    const payload = {
      volunteer_id: 1,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    }

    console.log('📤 REQUEST BODY:')
    console.log(JSON.stringify(payload, null, 2))

    const res = await request(app).post('/api/slots').send(payload)

    console.log('RESPONSE STATUS:', res.status)
    console.log('RESPONSE BODY:')
    console.log(JSON.stringify(res.body, null, 2))

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.volunteer_id).toBe(1)
    expect(res.body.start_time).toBeDefined()
    expect(res.body.end_time).toBeDefined()
  })

  it('should reject when end_time is before start_time', async () => {
    const start = new Date(Date.now() + 3 * 60 * 60 * 1000)
    const end = new Date(Date.now() + 1 * 60 * 60 * 1000)

    const payload = {
      volunteer_id: 1,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    }

    const res = await request(app).post('/api/slots').send(payload)

    console.log('INVALID END TEST:', res.status, res.body)

    expect(res.status).toBe(400)
  })

  it('should reject when start_time is in the past', async () => {
    const start = new Date(Date.now() - 60 * 60 * 1000)
    const end = new Date(Date.now() + 60 * 60 * 1000)

    const payload = {
      volunteer_id: 1,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    }

    const res = await request(app).post('/api/slots').send(payload)

    console.log('PAST TIME TEST:', res.status, res.body)

    expect(res.status).toBe(400)
  })

  it('should reject missing required fields', async () => {
    const payload = {
      volunteer_id: 1,
    }

    const res = await request(app).post('/api/slots').send(payload)

    console.log('MISSING FIELD TEST:', res.status, res.body)

    expect(res.status).toBe(400)
  })
})
