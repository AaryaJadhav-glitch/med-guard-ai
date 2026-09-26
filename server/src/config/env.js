import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server root or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'Med - Guard AI <clinical-safety@medguard-ai.internal>',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '419199290607-c3c3unjgc7jgmjgluegoruca3f4e139j.apps.googleusercontent.com'
};

// Diagnostic warning without breaking startup if variables are still being configured
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.warn('⚠️  Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment.');
}
if (!config.geminiApiKey) {
  console.warn('⚠️  Warning: GEMINI_API_KEY is missing. AI analysis will run in fallback simulation mode until configured.');
}
