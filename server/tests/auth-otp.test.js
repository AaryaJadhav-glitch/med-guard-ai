import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateVerificationOtp } from '../src/services/email.service.js';
import { createOtpForEmail, verifyOtpForEmail, getActiveOtp } from '../src/services/otp.service.js';

describe('Med - Guard AI OTP Verification Engine', () => {
  it('generates a random OTP containing exactly 3 letters and 3 numbers', () => {
    const code = generateVerificationOtp();
    assert.equal(code.length, 6, 'Code must be exactly 6 characters');
    const matchesPattern = /^[A-Z]{3}[0-9]{3}$/.test(code);
    assert.equal(matchesPattern, true, `Generated code ${code} must match 3 uppercase letters followed by 3 numbers`);
  });

  it('generates unique random codes on consecutive invocations', () => {
    const codes = new Set();
    for (let i = 0; i < 20; i++) {
      codes.add(generateVerificationOtp());
    }
    assert.ok(codes.size > 15, 'Consecutive OTP codes should be randomized');
  });

  it('stores and validates OTP code accurately (case-insensitive & whitespace-tolerant)', () => {
    const testEmail = 'otp.test@medguard-ai.internal';
    const code = createOtpForEmail(testEmail, { fullName: 'Dr. Test' });

    assert.ok(getActiveOtp(testEmail), 'Active OTP record must exist');

    // Test with lowercase & hyphen formatting (e.g. "med-123")
    const formattedInput = `${code.slice(0, 3).toLowerCase()}-${code.slice(3)}`;
    const result = verifyOtpForEmail(testEmail, formattedInput);

    assert.equal(result.valid, true, 'OTP verification must be valid');
    assert.equal(getActiveOtp(testEmail), null, 'Used OTP must be consumed and deleted');
  });

  it('rejects incorrect OTP and decrements remaining attempts', () => {
    const testEmail = 'invalid.test@medguard-ai.internal';
    createOtpForEmail(testEmail, { fullName: 'Dr. Incorrect' });

    const result = verifyOtpForEmail(testEmail, 'WRONG1');
    assert.equal(result.valid, false, 'Invalid code must be rejected');
    assert.ok(result.error.includes('attempt'), 'Error message must specify remaining attempts');
  });
});
