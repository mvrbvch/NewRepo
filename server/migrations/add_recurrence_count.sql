-- Add recurrence_count column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;

-- Add recurrence_count column to household_tasks table
ALTER TABLE household_tasks ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;

-- Add comments to explain the columns
COMMENT ON COLUMN events.recurrence_count IS 'Maximum number of occurrences for recurring events';
COMMENT ON COLUMN household_tasks.recurrence_count IS 'Maximum number of occurrences for recurring tasks'; 