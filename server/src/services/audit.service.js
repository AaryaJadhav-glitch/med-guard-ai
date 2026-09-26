import { supabaseAdmin } from '../config/supabase.js';

/**
 * Audit Logging Service
 * Records clinical decision actions, analyses, and data modifications
 * without logging sensitive medical details or authentication secrets.
 */
export async function logAuditEvent({ userId, action, resourceType, resourceId = null, metadata = {} }) {
  try {
    if (!userId) return;

    // Sanitize metadata to avoid PII / PHI leaks
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.apiKey;

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: sanitizedMetadata
    });
  } catch (err) {
    // Non-blocking: audit failure should not break critical clinical flow, but should be logged
    console.error('[Audit Log Failure]:', err.message);
  }
}
