import { SqliteAdapter } from './adapters/sqlite.adapter'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const MIGRATIONS_DIR = join(import.meta.dir, '..', '..', 'migrations', 'sqlite')

export function createTestDb(): SqliteAdapter {
  const adapter = new SqliteAdapter({ type: 'sqlite', url: ':memory:' })

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
    adapter.run(sql)
  }

  return adapter
}
