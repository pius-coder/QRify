CREATE TABLE IF NOT EXISTS work_schedules (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    start_time TEXT NOT NULL,
    break_start_time TEXT,
    break_end_time TEXT,
    end_time TEXT NOT NULL,
    late_tolerance_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
