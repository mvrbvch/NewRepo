import { Pool } from 'pg';
import * as schema from './shared/schema';

async function main() {
  console.log('Creating database tables...');
  
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create connection with SSL configuration
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Create tables directly from schema
    await pool.query(`
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
      
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        location TEXT,
        emoji TEXT,
        period TEXT NOT NULL,
        recurrence TEXT,
        recurrence_end DATE,
        recurrence_rule TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS event_shares (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        permission TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS event_comments (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS calendar_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP WITH TIME ZONE,
        sync_enabled BOOLEAN DEFAULT TRUE
      );
      
      CREATE TABLE IF NOT EXISTS partner_invites (
        id SERIAL PRIMARY KEY,
        inviter_id INTEGER NOT NULL REFERENCES users(id),
        email TEXT,
        phone_number TEXT,
        token TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
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
      
      CREATE TABLE IF NOT EXISTS task_completion_history (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES household_tasks(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        completed_date TIMESTAMP NOT NULL,
        expected_date TIMESTAMP,
        is_completed BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      );
    `);
    
    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Failed to create tables:', error);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error in main function:', err);
  process.exit(1);
});