const jwtSecretEnv = process.env.JWT_SECRET

if (!jwtSecretEnv && process.env.NODE_ENV !== 'test') {
  throw new Error('JWT_SECRET environment variable is required')
}

export const jwtSecret = jwtSecretEnv ?? 'test-secret'

export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h'

export const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3002'

export const aiTimeoutMs = Number.parseInt(process.env.AI_TIMEOUT_MS ?? '25000', 10) || 25000