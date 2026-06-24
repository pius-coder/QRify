import { Database } from 'bun:sqlite'
import { runMigrations } from './migrate'

async function seed(db: Database): Promise<void> {
  const superAdminId = crypto.randomUUID()
  const companyId = crypto.randomUUID()
  const companyAdminId = crypto.randomUUID()
  const employee1Id = crypto.randomUUID()
  const employee2Id = crypto.randomUUID()
  const employee3Id = crypto.randomUUID()
  const scheduleId = crypto.randomUUID()

  const passwordHash = await Bun.password.hash('password123', { algorithm: 'bcrypt', cost: 10 })

  db.run(
    `INSERT INTO users (id, company_id, first_name, last_name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [superAdminId, null, 'Super', 'Admin', 'super@qrify.dev', passwordHash, 'SUPER_ADMIN', 'ACTIVE'],
  )

  db.run(
    `INSERT INTO companies (id, name, company_code, timezone, status)
     VALUES (?, ?, ?, ?, ?)`,
    [companyId, 'Demo SARL', 'DEMO7X91', 'Europe/Paris', 'ACTIVE'],
  )

  db.run(
    `INSERT INTO users (id, company_id, first_name, last_name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [companyAdminId, companyId, 'Jean', 'Admin', 'admin@demo.com', passwordHash, 'COMPANY_ADMIN', 'ACTIVE'],
  )

  db.run(
    `INSERT INTO users (id, company_id, first_name, last_name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [employee1Id, companyId, 'Alice', 'Martin', 'alice@demo.com', passwordHash, 'EMPLOYEE', 'ACTIVE'],
  )

  db.run(
    `INSERT INTO users (id, company_id, first_name, last_name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [employee2Id, companyId, 'Bob', 'Dupont', 'bob@demo.com', passwordHash, 'EMPLOYEE', 'ACTIVE'],
  )

  db.run(
    `INSERT INTO users (id, company_id, first_name, last_name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [employee3Id, companyId, 'Claire', 'Petit', 'claire@demo.com', passwordHash, 'EMPLOYEE', 'ACTIVE'],
  )

  db.run(
    `INSERT INTO work_schedules (id, company_id, start_time, break_start_time, break_end_time, end_time, late_tolerance_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [scheduleId, companyId, '09:00', '12:30', '13:30', '18:00', 5],
  )

  const weekdays = [1, 2, 3, 4, 5]
  for (const weekday of weekdays) {
    db.run(
      `INSERT INTO work_schedule_days (id, schedule_id, weekday) VALUES (?, ?, ?)`,
      [crypto.randomUUID(), scheduleId, weekday],
    )
  }

  console.log('Seed data created:')
  console.log(`  Super admin: super@qrify.dev / password123`)
  console.log(`  Company: Demo SARL (DEMO7X91)`)
  console.log(`  Company admin: admin@demo.com / password123`)
  console.log(`  Employees: alice@demo.com, bob@demo.com, claire@demo.com / password123`)
  console.log(`  Work schedule: Mon-Fri 09:00-12:30, 13:30-18:00`)
}

export async function main(): Promise<void> {
  const dbPath = process.env.DATABASE_URL || './data/qrify.sqlite'
  const db = new Database(dbPath)
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA journal_mode = WAL')

  runMigrations(db)
  await seed(db)

  db.close()
}

await main()
