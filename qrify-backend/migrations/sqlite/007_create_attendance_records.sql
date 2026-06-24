CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    work_date TEXT NOT NULL,
    arrival_at TEXT,
    break_start_at TEXT,
    break_end_at TEXT,
    departure_at TEXT,
    status TEXT NOT NULL DEFAULT 'PRESENT' CHECK(status IN ('PRESENT','LATE','ABSENT','INCOMPLETE')),
    late_minutes INTEGER NOT NULL DEFAULT 0,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    worked_minutes INTEGER NOT NULL DEFAULT 0,
    overtime_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(company_id, user_id, work_date)
);
