import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from './sqlite.adapter'

describe('SqliteAdapter', () => {
  let adapter: SqliteAdapter

  beforeEach(() => {
    adapter = new SqliteAdapter({ type: 'sqlite', url: ':memory:' })
  })

  describe('query', () => {
    it('runs SELECT and returns rows', () => {
      adapter.run("CREATE TABLE test (id INTEGER, name TEXT)")
      adapter.run("INSERT INTO test VALUES (1, 'hello')")

      const result = adapter.query<{ id: number; name: string }>('SELECT * FROM test')

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]?.name).toBe('hello')
    })

    it('returns empty rows for empty table', () => {
      adapter.run("CREATE TABLE test (id INTEGER)")

      const result = adapter.query<{ id: number }>('SELECT * FROM test')

      expect(result.rows).toHaveLength(0)
      expect(result.rowCount).toBe(0)
    })

    it('supports parameterized queries', () => {
      adapter.run("CREATE TABLE test (id INTEGER, name TEXT)")
      adapter.run("INSERT INTO test VALUES (1, 'hello')")
      adapter.run("INSERT INTO test VALUES (2, 'world')")

      const result = adapter.query<{ id: number; name: string }>(
        'SELECT * FROM test WHERE id = ?',
        [1]
      )

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]?.name).toBe('hello')
    })
  })

  describe('run', () => {
    it('returns changes count and lastInsertRowid', () => {
      adapter.run("CREATE TABLE test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)")

      const result = adapter.run("INSERT INTO test (name) VALUES ('hello')")

      expect(result.changes).toBe(1)
      expect(result.lastInsertRowid).toBe(1)
    })

    it('returns zero changes for SELECT', () => {
      adapter.run("CREATE TABLE test (id INTEGER)")

      const result = adapter.run('SELECT * FROM test')

      expect(result.changes).toBe(0)
    })
  })

  describe('transaction', () => {
    it('commits changes on success', () => {
      adapter.run("CREATE TABLE test (id INTEGER, name TEXT)")

      adapter.transaction(() => {
        adapter.run("INSERT INTO test VALUES (1, 'a')")
        adapter.run("INSERT INTO test VALUES (2, 'b')")
      })

      const { rows } = adapter.query<{ id: number }>('SELECT * FROM test')
      expect(rows).toHaveLength(2)
    })

    it('rolls back on error', () => {
      adapter.run("CREATE TABLE test (id INTEGER, name TEXT)")

      expect(() => {
        adapter.transaction(() => {
          adapter.run("INSERT INTO test VALUES (1, 'a')")
          throw new Error('rollback')
        })
      }).toThrow('rollback')

      const { rows } = adapter.query<{ id: number }>('SELECT * FROM test')
      expect(rows).toHaveLength(0)
    })
  })

  describe('disconnect', () => {
    it('closes the database', () => {
      adapter.disconnect()

      expect(() => adapter.run('SELECT 1')).toThrow()
    })
  })
})
