import { describe, expect, it } from 'vitest'
import app from '../src/app.js'
import { getTursoClient } from '../src/turso.js'

describe('bootstrap', () => {
  it('exposes a single client with the schema initialized', async () => {
    expect(getTursoClient()).toBe(getTursoClient())
    const result = await getTursoClient().execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'"
    )
    expect(result.rows).toHaveLength(1)
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