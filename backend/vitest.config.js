import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      TURSO_DATABASE_URL: 'file::memory:?cache=shared'
    }
  }
})