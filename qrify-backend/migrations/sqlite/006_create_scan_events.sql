CREATE TABLE IF NOT EXISTS scan_events (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    qr_session_id TEXT REFERENCES qr_sessions(id),
    event_type TEXT NOT NULL CHECK(event_type IN ('ARRIVAL','BREAK_START','BREAK_END','DEPARTURE')),
    scanned_at TEXT NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('ACCEPTED','DUPLICATE','EXPIRED','INVALID_SEQUENCE','WRONG_COMPANY','USER_NOT_ACTIVE','COMPANY_SUSPENDED','INVALID_TOKEN')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
