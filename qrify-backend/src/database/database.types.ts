export type DatabaseEngine = 'sqlite'

export interface DbConfig {
  type: DatabaseEngine
  url: string
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
  rowCount: number
}

export interface DatabaseAdapter {
  connect(): void
  disconnect(): void
  query<T>(sql: string, params?: unknown[]): QueryResult<T>
  run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number }
  transaction<T>(fn: () => T): T
}
