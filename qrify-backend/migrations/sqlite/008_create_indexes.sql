CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_status ON users(company_id, status);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_company_date ON qr_sessions(company_id, work_date);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_token_hash ON qr_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_scan_events_user_scanned ON scan_events(user_id, scanned_at);
CREATE INDEX IF NOT EXISTS idx_attendance_company_date ON attendance_records(company_id, work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, work_date);
