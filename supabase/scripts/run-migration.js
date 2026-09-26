#!/usr/bin/env node

/**
 * Med-Guard AI - Supabase Migration Runner
 * Applies database migrations & seed functions to Supabase PostgreSQL.
 *
 * Supports:
 * 1. DATABASE_URL (Direct connection string from Supabase Dashboard > Settings > Database)
 * 2. Automatic connection string assembly from SUPABASE_URL + DB_PASSWORD
 * 3. Supabase REST query endpoint if configured
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root or server/.env
const rootEnvPath = path.resolve(__dirname, '../../.env');
const serverEnvPath = path.resolve(__dirname, '../../server/.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  dotenv.config();
}

const { Client } = pg;

async function runMigration() {
  console.log('----------------------------------------------------');
  console.log('🩺 Med-Guard AI: Database Migration Runner');
  console.log('----------------------------------------------------');

  let connectionString = process.env.DATABASE_URL;

  // If DATABASE_URL is not set directly, check if we can form one from SUPABASE_URL and DB_PASSWORD
  if (!connectionString && process.env.SUPABASE_URL && process.env.DB_PASSWORD) {
    try {
      const parsedUrl = new URL(process.env.SUPABASE_URL);
      const projectRef = parsedUrl.hostname.split('.')[0];
      connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(process.env.DB_PASSWORD)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`;
    } catch {
      // Ignore URL parsing errors
    }
  }

  const migrationFile = path.resolve(__dirname, '../migrations/001_initial_schema.sql');
  const seedFile = path.resolve(__dirname, '../seed.sql');

  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(migrationFile, 'utf8');
  const seedSql = fs.existsSync(seedFile) ? fs.readFileSync(seedFile, 'utf8') : '';

  if (!connectionString) {
    console.log('ℹ️  No direct DATABASE_URL detected.');
    console.log('');
    console.log('To apply migrations to your Supabase Cloud PostgreSQL database:');
    console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to "SQL Editor" -> "New query"');
    console.log('3. Paste the contents of: supabase/migrations/001_initial_schema.sql');
    console.log('4. Click "Run"');
    console.log('5. (Optional) Paste and run: supabase/seed.sql');
    console.log('');
    console.log('Alternatively, set DATABASE_URL in your .env:');
    console.log('DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
    console.log('and re-run: npm run migrate');
    console.log('----------------------------------------------------');
    return;
  }

  console.log('🔌 Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase PostgreSQL.');

    console.log('🚀 Executing migration: 001_initial_schema.sql...');
    await client.query(migrationSql);
    console.log('✅ 001_initial_schema.sql executed successfully.');

    if (seedSql) {
      console.log('🌱 Executing seed functions: seed.sql...');
      await client.query(seedSql);
      console.log('✅ seed.sql functions loaded successfully.');
    }

    console.log('✨ All migrations applied successfully!');
    console.log('Tables, Triggers, Indexes, and RLS policies are active.');
  } catch (err) {
    console.error('❌ Migration failed with error:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runMigration().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
