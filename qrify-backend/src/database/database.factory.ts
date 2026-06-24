import { env } from '../config/env'
import type { DatabaseAdapter, DbConfig } from './database.types'
import { SqliteAdapter } from './adapters/sqlite.adapter'

let instance: DatabaseAdapter | null = null

export function createDatabase(): DatabaseAdapter {
  if (instance) return instance

  const config: DbConfig = {
    type: env.DB_TYPE,
    url: env.DATABASE_URL,
  }

  switch (config.type) {
    case 'sqlite':
      instance = new SqliteAdapter(config)
      break
    default:
      throw new Error(`Unsupported database type: ${config.type}`)
  }

  return instance
}

export function getDatabase(): DatabaseAdapter {
  if (!instance) {
    return createDatabase()
  }
  return instance
}

export function closeDatabase(): void {
  if (instance) {
    instance.disconnect()
    instance = null
  }
}
