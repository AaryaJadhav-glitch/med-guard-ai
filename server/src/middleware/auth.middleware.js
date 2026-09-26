import { supabaseAdmin, getScopedSupabaseClient } from '../config/supabase.js';

/**
 * Authentication middleware that validates Supabase JWTs.
 * Extracts user details and attaches both req.user and a scoped Supabase client (req.supabase)
 * to ensure that all database queries are subject to PostgreSQL Row Level Security (RLS).
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required. Missing or malformed authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. No token provided.'
      });
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired session. Please log in again.'
      });
    }

    // Attach validated user and token
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: user.user_metadata || {}
    };
    req.token = token;

    // Attach scoped Supabase client for RLS enforcement
    req.supabase = getScopedSupabaseClient(token);

    next();
  } catch (err) {
    console.error('Auth middleware unexpected error:', err.message);
    return res.status(500).json({
      error: 'Authentication service encountered an unexpected error.'
    });
  }
}
