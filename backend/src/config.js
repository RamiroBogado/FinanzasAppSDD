const jwtSecretEnv = process.env.JWT_SECRET

if (!jwtSecretEnv && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}

export const jwtSecret = jwtSecretEnv ?? (process.env.NODE_ENV === 'test' ? 'test-secret' : 'finanzasapp-dev-secret')

export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h'

export const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3002'