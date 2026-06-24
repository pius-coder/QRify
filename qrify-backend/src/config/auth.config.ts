export const AUTH_CONFIG = {
  JWT_ALGORITHM: 'HS256' as const,
  COOKIE_NAME: 'qrify_token',
  COOKIE_PATH: '/',
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60,
  COMPANY_CODE_REGEX: /^[A-Z0-9_]+$/,
} as const
