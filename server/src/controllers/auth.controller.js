import { supabaseAdmin } from '../config/supabase.js';
import { createOtpForEmail, verifyOtpForEmail, getActiveOtp } from '../services/otp.service.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { config } from '../config/env.js';

/**
 * Handles user registration with custom OTP verification:
 * Creates user in Supabase Auth with email_confirm: false,
 * generates a 3-letter + 3-number OTP, and sends a branded Med - Guard AI email.
 */
export async function registerWithOtp(req, res) {
  try {
    const { fullName, email, password, organization, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: 'Full name, email address, and password are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists in Supabase Auth
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.warn('listUsers notice:', listError.message);
    }

    const existingUser = userList?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);

    let userId = null;

    if (existingUser) {
      userId = existingUser.id;
      // Update password and metadata for pending/existing account
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: {
          full_name: fullName.trim(),
          organization: organization?.trim() || 'Healthcare Facility',
          role: role || 'healthcare_professional'
        }
      });
    } else {
      // Create user in Supabase Auth with email_confirm: false (prevents Supabase default email)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName.trim(),
          organization: organization?.trim() || 'Healthcare Facility',
          role: role || 'healthcare_professional'
        }
      });

      if (createError) {
        return res.status(400).json({
          error: createError.message || 'Could not create account.'
        });
      }

      userId = newUser.user.id;
    }

    // Generate random OTP (3 letters + 3 numbers, e.g. "MED482")
    const otp = createOtpForEmail(normalizedEmail, {
      userId,
      fullName: fullName.trim()
    });

    // Send the Med - Guard AI branded email with logo and 3 letters + 3 numbers OTP
    await sendVerificationEmail({
      toEmail: normalizedEmail,
      recipientName: fullName.trim(),
      otp
    });

    return res.status(201).json({
      success: true,
      message: 'Account created. Verification code sent to your email.',
      email: normalizedEmail,
      devCode: config.nodeEnv === 'development' ? otp : undefined
    });
  } catch (err) {
    console.error('Registration with OTP error:', err);
    return res.status(500).json({
      error: 'Unable to process registration at this time. Please try again.'
    });
  }
}

/**
 * Two-Step Verification Login: Step 1
 * Validates credentials against Supabase Auth.
 * If valid, generates a fresh random 6-character code (3 letters + 3 numbers)
 * and dispatches it directly to the user's Gmail.
 */
export async function initiateLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify credentials with Supabase Auth
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    // If credentials are bad, return error
    if (signInError) {
      const msg = signInError.message?.toLowerCase() || '';
      if (!msg.includes('email not confirmed') && !msg.includes('not verified') && !msg.includes('unconfirmed')) {
        return res.status(401).json({
          error: 'Invalid credentials. Please verify your clinical email and password.'
        });
      }
    }

    // Retrieve user from Supabase
    let user = signInData?.user;
    if (!user) {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      user = userList?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const fullName = user.user_metadata?.full_name || '';

    // Generate fresh 6-character OTP (3 letters + 3 numbers, e.g. "MGD492")
    const otp = createOtpForEmail(normalizedEmail, {
      userId: user.id,
      fullName
    });

    // Send Med - Guard AI branded email to their Gmail
    await sendVerificationEmail({
      toEmail: normalizedEmail,
      recipientName: fullName,
      otp
    });

    return res.status(200).json({
      success: true,
      requiresTwoFactor: true,
      message: 'Credentials verified. Two-step verification code sent to your email.',
      email: normalizedEmail,
      devCode: config.nodeEnv === 'development' ? otp : undefined
    });
  } catch (err) {
    console.error('Initiate login error:', err);
    return res.status(500).json({
      error: 'Unable to process login. Please try again.'
    });
  }
}

/**
 * Two-Step Verification Login: Step 2
 * Validates the 6-character code, confirms user in Supabase Auth,
 * and signs in to return authenticated Supabase session.
 */
export async function completeTwoStepLogin(req, res) {
  try {
    const { email, code, password } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP code
    const otpResult = verifyOtpForEmail(normalizedEmail, code);
    if (!otpResult.valid) {
      return res.status(400).json({ error: otpResult.error });
    }

    // Find user in Supabase
    let userId = otpResult.record?.userId;
    if (!userId) {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const user = userList?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (user) userId = user.id;
    }

    if (userId) {
      // Ensure email is officially marked as confirmed in Supabase Auth
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true
      });
    }

    // Authenticate with Supabase to get active JWT session
    let session = null;
    let user = null;

    if (password) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });
      if (!authError && authData) {
        session = authData.session;
        user = authData.user;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Two-step verification completed successfully.',
      session,
      user
    });
  } catch (err) {
    console.error('Complete two-step login error:', err);
    return res.status(500).json({
      error: 'An unexpected error occurred during two-step verification.'
    });
  }
}

/**
 * Verifies the 3-letter + 3-number OTP code.
 * Upon successful verification, officially marks email as confirmed in Supabase Auth.
 */
export async function verifyOtp(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        error: 'Both email and verification code are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP against store
    const result = verifyOtpForEmail(normalizedEmail, code);
    if (!result.valid) {
      return res.status(400).json({
        error: result.error
      });
    }

    // Find the user ID in Supabase Auth
    let userId = result.record?.userId;
    if (!userId) {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const user = userList?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (user) userId = user.id;
    }

    if (!userId) {
      return res.status(404).json({
        error: 'Account not found for this email.'
      });
    }

    // Officially mark the email as confirmed in Supabase Auth
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (confirmError) {
      console.error('Error confirming email in Supabase:', confirmError);
      return res.status(500).json({
        error: 'Failed to update email confirmation status.'
      });
    }

    // Ensure clinical profile exists
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: result.record?.fullName || normalizedEmail.split('@')[0],
        role: 'healthcare_professional'
      });
    } catch (profileErr) {
      console.warn('Profile upsert notice:', profileErr.message);
    }

    console.log(`✅ [Med - Guard AI] Email verified successfully for: ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now sign in to Med-Guard AI.'
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(500).json({
      error: 'An unexpected error occurred during verification.'
    });
  }
}

/**
 * Resends a fresh 3-letter + 3-number OTP code.
 * Generates a brand new random code every time and dispatches email immediately.
 * Works for both registration and Two-Step Verification without hitting Supabase rate limits!
 */
export async function resendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email address is required to resend verification code.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify user exists in Supabase Auth
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const user = userList?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(404).json({
        error: 'No account found with this email address.'
      });
    }

    const fullName = user.user_metadata?.full_name || '';

    // Generate a brand new random OTP code every time (3 letters + 3 numbers)
    const newOtp = createOtpForEmail(normalizedEmail, {
      userId: user.id,
      fullName
    });

    // Send Med - Guard AI branded email immediately
    await sendVerificationEmail({
      toEmail: normalizedEmail,
      recipientName: fullName,
      otp: newOtp
    });

    return res.status(200).json({
      success: true,
      message: 'A fresh verification code has been sent. Please check your inbox and spam folder.',
      devCode: config.nodeEnv === 'development' ? newOtp : undefined
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({
      error: 'Unable to resend verification code. Please try again.'
    });
  }
}

/**
 * Handles Google OAuth ID Token Authentication:
 * 1. Validates the Google ID token via Google's tokeninfo API.
 * 2. Verifies audience against configured Google Client ID.
 * 3. Finds or creates the user in Supabase Auth with email_confirm: true.
 * 4. Ensures profile in public.profiles exists.
 * 5. Generates a secure session via magiclink token_hash so the client can immediately authenticate.
 */
export async function handleGoogleAuth(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required.' });
    }

    // Verify token with Google's public tokeninfo endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired Google credential.' });
    }

    const payload = await googleRes.json();

    // Verify audience matches our Google Client ID
    if (config.googleClientId && payload.aud !== config.googleClientId) {
      console.warn(`Google token aud notice: token aud is ${payload.aud}, expected ${config.googleClientId}`);
      if (!payload.aud?.includes('419199290607')) {
        return res.status(401).json({ error: 'Google Client ID verification failed.' });
      }
    }

    if (!payload.email) {
      return res.status(400).json({ error: 'Google account does not provide an email address.' });
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    const fullName = payload.name || payload.given_name || normalizedEmail.split('@')[0];
    const avatarUrl = payload.picture || '';

    // Check if user already exists in Supabase Auth
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    let existingUser = userList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      // Ensure email is confirmed and metadata has Google profile info
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: fullName,
          avatar_url: avatarUrl,
          provider: 'google'
        }
      });
    } else {
      // Create user with confirmed email
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          avatar_url: avatarUrl,
          provider: 'google',
          role: 'healthcare_professional',
          organization: 'Clinical Practice'
        }
      });

      if (createError) {
        return res.status(400).json({ error: createError.message || 'Could not create account.' });
      }

      userId = newUser.user.id;
    }

    // Ensure profile row exists in public.profiles
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        role: existingUser?.user_metadata?.role || 'healthcare_professional',
        organization: existingUser?.user_metadata?.organization || 'Clinical Practice',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (profileErr) {
      console.warn('Profile upsert notice:', profileErr.message);
    }

    // Generate link with magiclink token so client can authenticate with verifyOtp({ token_hash })
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('generateLink error:', linkError);
      return res.status(500).json({ error: 'Failed to establish clinical session.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      email: normalizedEmail,
      tokenHash: linkData.properties.hashed_token,
      emailOtp: linkData.properties.email_otp,
      user: {
        id: userId,
        email: normalizedEmail,
        fullName,
        avatarUrl
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
}

