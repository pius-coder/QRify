import { Database } from 'bun:sqlite'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { ALL_TABLES } from '../src/database/constants'

const MIGRATIONS_DIR = join(import.meta.dir, '..', 'migrations', 'sqlite')

export function runMigrations(db: Database): void {
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA journal_mode = WAL')

  db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  const appliedRows = db.query('SELECT filename FROM _migrations').all() as { filename: string }[]
  const applied = new Set(appliedRows.map(r => r.filename))
  const pending = files.filter(f => !applied.has(f))

  for (const file of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')

    db.run('BEGIN')
    try {
      db.run(sql)
      db.run('INSERT INTO _migrations (filename) VALUES (?)', [file])
      db.run('COMMIT')
      console.log(`Applied migration: ${file}`)
    } catch (e) {
      db.run('ROLLBACK')
      throw e
    }
  }

  if (pending.length === 0) {
    console.log('All migrations already applied')
  }
}

export function main(): void {
  const dbPath = process.env.DATABASE_URL || './data/qrify.sqlite'
  const db = new Database(dbPath)

  if (process.argv.includes('--reset')) {
    console.log('Resetting database...')
    for (const table of ALL_TABLES) {
      db.run(`DROP TABLE IF EXISTS ${table}`)
    }
    console.log('All tables dropped')
  }

  runMigrations(db)
  db.close()
}

main()
