CREATE TABLE IF NOT EXISTS qr_sessions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    work_date TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('ARRIVAL','BREAK_START','BREAK_END','DEPARTURE')),
    token_hash TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('SCHEDULED','ACTIVE','EXPIRED','REVOKED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(company_id, work_date, event_type)
);
