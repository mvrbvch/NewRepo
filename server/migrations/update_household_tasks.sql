-- Drop existing foreign key constraints
ALTER TABLE household_tasks DROP CONSTRAINT IF EXISTS household_tasks_assigned_to_users_id_fk;
ALTER TABLE household_tasks DROP CONSTRAINT IF EXISTS household_tasks_created_by_users_id_fk;

-- Drop existing columns
ALTER TABLE household_tasks DROP COLUMN IF EXISTS frequency;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS created_by;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS completed_at;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS weekdays;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS month_day;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS priority;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS position;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS category;
ALTER TABLE household_tasks DROP COLUMN IF EXISTS is_special;

-- Add new columns
ALTER TABLE household_tasks ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE household_tasks ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'never';
ALTER TABLE household_tasks ADD COLUMN IF NOT EXISTS recurrence_end TIMESTAMP;
ALTER TABLE household_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update user_id for existing records (using the first user in the system)
UPDATE household_tasks SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE household_tasks ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE household_tasks ADD CONSTRAINT household_tasks_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id); 