import { describe, expect, it } from 'vitest'
import app from '../src/app.js'
import { getDatabase } from '../src/db.js'

describe('bootstrap', () => {
  it('opens an in-memory database in test environment', () => {
    expect(getDatabase().name).toBe(':memory:')
  })

  it('responds on /health', async () => {
    const server = app.listen(0)
    const { port } = server.address()
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.status).toBe('ok')
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})