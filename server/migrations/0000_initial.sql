-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    birthday TIMESTAMP NOT NULL,
    avatar TEXT,
    phone_number TEXT,
    partner_id INTEGER REFERENCES users(id),
    partner_status TEXT DEFAULT 'none',
    onboarding_complete BOOLEAN DEFAULT false
);

-- Create household_tasks table
CREATE TABLE IF NOT EXISTS household_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    due_time TEXT,
    next_due_date TIMESTAMP,
    next_due_time TEXT,
    completed BOOLEAN DEFAULT false,
    recurrence TEXT DEFAULT 'never',
    recurrence_end TIMESTAMP,
    recurrence_rule TEXT,
    recurrence_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create task_completion_history table
CREATE TABLE IF NOT EXISTS task_completion_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES household_tasks(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    completed_date TIMESTAMP NOT NULL,
    expected_date TIMESTAMP,
    is_completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 