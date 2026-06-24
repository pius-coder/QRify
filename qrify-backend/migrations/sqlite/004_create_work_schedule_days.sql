CREATE TABLE IF NOT EXISTS work_schedule_days (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL REFERENCES work_schedules(id),
    weekday INTEGER NOT NULL CHECK(weekday BETWEEN 1 AND 7),
    UNIQUE(schedule_id, weekday)
);
