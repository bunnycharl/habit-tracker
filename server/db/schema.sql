-- Habit Tracker Database Schema
-- SQLite Database

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    pin_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: habits
-- Stores habit definitions
CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6CEFA0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    archived INTEGER DEFAULT 0,
    user_id INTEGER DEFAULT 1
);

-- Table: executions
-- Stores daily habit completions
CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date DATE NOT NULL,
    completed INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, date)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_executions_habit_id ON executions(habit_id);
CREATE INDEX IF NOT EXISTS idx_executions_date ON executions(date);
CREATE INDEX IF NOT EXISTS idx_executions_habit_date ON executions(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(archived);

-- View: habit_stats
-- Aggregated statistics for each habit
CREATE VIEW IF NOT EXISTS habit_stats AS
SELECT
    h.id,
    h.name,
    h.color,
    h.created_at,
    COUNT(e.id) as total_executions,
    MAX(CASE WHEN e.completed = 1 THEN e.date END) as last_completion,
    (SELECT COUNT(*) FROM executions WHERE habit_id = h.id AND completed = 1) as completion_count
FROM habits h
LEFT JOIN executions e ON h.id = e.habit_id
WHERE h.archived = 0
GROUP BY h.id, h.name, h.color, h.created_at;
