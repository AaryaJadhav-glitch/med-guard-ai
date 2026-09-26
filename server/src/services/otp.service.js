import { generateVerificationOtp } from './email.service.js';

/**
 * In-memory secure OTP storage with expiration and attempt limiting.
 * Key: normalized email (lowercase)
 * Value: { code, userId, fullName, expiresAt, attempts }
 */
const otpStore = new Map();

// OTP lifespan: 15 minutes
const OTP_EXPIRY_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Creates or replaces an active OTP for the specified email.
 * Always generates a brand new code containing 3 letters and 3 numbers.
 */
export function createOtpForEmail(email, { userId = null, fullName = '' } = {}) {
  const normalizedEmail = email.trim().toLowerCase();
  const code = generateVerificationOtp();

  otpStore.set(normalizedEmail, {
    code: code.toUpperCase(),
    userId,
    fullName,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
    createdAt: Date.now()
  });

  return code;
}

/**
 * Retrieves the active OTP record for an email if it exists and has not expired.
 */
export function getActiveOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return null;
  }

  return record;
}

/**
 * Updates the user ID associated with an active OTP record.
 */
export function setOtpUserId(email, userId) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);
  if (record) {
    record.userId = userId;
  }
}

/**
 * Verifies an OTP code for an email.
 * Returns { valid: boolean, error?: string, record?: object }
 */
export function verifyOtpForEmail(email, inputCode) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return {
      valid: false,
      error: 'No active verification code found. Please request a new code.'
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: 'Verification code has expired. Please request a new code.'
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: 'Maximum verification attempts exceeded. Please request a new code.'
    };
  }

  // Normalize code: remove spaces/hyphens and convert to uppercase
  const cleanInput = (inputCode || '').replace(/[\s-]/g, '').toUpperCase();
  const cleanStored = record.code.replace(/[\s-]/g, '').toUpperCase();

  if (cleanInput !== cleanStored) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    };
  }

  // Valid! Delete the OTP record so it cannot be reused
  otpStore.delete(normalizedEmail);
  return {
    valid: true,
    record
  };
}

/**
 * Periodic cleanup of expired OTP records to prevent memory leak
 */
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

if (cleanupTimer.unref) {
  cleanupTimer.unref();
}
