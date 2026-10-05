import { createClient } from '@libsql/client'

let client

export function getTursoClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is required')
    }

    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN environment variable is required')
    }

    client = createClient({
      url,
      authToken
    })
  }

  return client
}
