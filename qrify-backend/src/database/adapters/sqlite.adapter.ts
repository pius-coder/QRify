import { Database } from 'bun:sqlite'
import type { DatabaseAdapter, DbConfig, QueryResult } from '../database.types'

export class SqliteAdapter implements DatabaseAdapter {
  private db: Database

  constructor(private config: DbConfig) {
    this.db = new Database(config.url, { create: true })
    this.db.run('PRAGMA journal_mode = WAL')
    this.db.run('PRAGMA foreign_keys = ON')
    this.db.run('PRAGMA busy_timeout = 5000')
  }

  connect(): void {
  }

  disconnect(): void {
    this.db.close(false)
  }

  query<T>(sql: string, params?: unknown[]): QueryResult<T> {
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT')
      || sql.trim().toUpperCase().startsWith('WITH')

    if (isSelect) {
      const stmt = this.db.query(sql)
      const rows = (params && params.length > 0
        ? stmt.all(...params as never[])
        : stmt.all()) as T[]
      return { rows, rowCount: rows.length }
    }

    if (params && params.length > 0) {
      this.db.run(sql, ...params as never[])
    } else {
      this.db.run(sql)
    }
    return { rows: [], rowCount: 0 }
  }

  run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number } {
    const result = params && params.length > 0
      ? this.db.run(sql, ...params as never[])
      : this.db.run(sql)
    return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) }
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)()
  }
}
