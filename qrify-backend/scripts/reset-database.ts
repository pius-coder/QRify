import { Database } from 'bun:sqlite'
import { runMigrations } from './migrate'
import { ALL_TABLES } from '../src/database/constants'

export function main(): void {
  const dbPath = process.env.DATABASE_URL || './data/qrify.sqlite'
  const db = new Database(dbPath)

  for (const table of ALL_TABLES) {
    db.run(`DROP TABLE IF EXISTS ${table}`)
  }

  runMigrations(db)

  console.log('Database reset complete')
  db.close()
}

main()
