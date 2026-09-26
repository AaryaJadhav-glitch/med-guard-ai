import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session.user.email_confirmed_at) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('Initial session check notice:', err.message);
      setLoading(false);
    });

    // 2. Listen for authentication state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user && newSession.user.email_confirmed_at) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else {
        setProfile({
          id: userId,
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Clinician',
          role: user?.user_metadata?.role || 'healthcare_professional',
          organization: user?.user_metadata?.organization || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Registers account and triggers Med - Guard AI branded verification code (3 letters + 3 numbers)
   */
  async function signUp({ email, password, fullName, organization, role }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, organization, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to complete registration.');
    }
    return data;
  }

  /**
   * Built-in Supabase Auth Sign In
   * Strictly enforces email verification check before allowing access
   */
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('email not confirmed') || msg.includes('not verified') || msg.includes('unconfirmed')) {
        const unconfirmedErr = new Error('Email Not Verified. Please verify your email before accessing Med - Guard AI.');
        unconfirmedErr.code = 'EMAIL_NOT_VERIFIED';
        unconfirmedErr.email = email;
        throw unconfirmedErr;
      }
      throw error;
    }

    // Verify email confirmation status directly on Supabase user object
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      const unconfirmedErr = new Error('Email Not Verified. Please verify your email before accessing Med - Guard AI.');
      unconfirmedErr.code = 'EMAIL_NOT_VERIFIED';
      unconfirmedErr.email = email;
      throw unconfirmedErr;
    }

    return data;
  }

  /**
   * Verifies the 6-character OTP (3 letters + 3 numbers)
   */
  async function verifyOtpCode(email, code) {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid or expired verification code.');
    }
    return data;
  }

  /**
   * Resends a fresh random verification code (3 letters + 3 numbers)
   */
  async function resendVerificationEmail(email) {
    const res = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification code.');
    }
    return data;
  }

  /**
   * Two-Step Verification: Step 1
   * Validates credentials against Supabase and triggers a fresh random 6-character
   * verification code (3 letters + 3 numbers) to the user's Gmail.
   */
  async function initiateTwoStepLogin({ email, password }) {
    const res = await fetch('/api/auth/login-initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to initiate two-step verification.');
    }
    return data;
  }

  /**
   * Two-Step Verification: Step 2
   * Validates the 6-character code, confirms the email in Supabase Auth,
   * and signs the clinician directly into their dashboard.
   */
  async function completeTwoStepLogin({ email, code, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().toUpperCase();

    const res = await fetch('/api/auth/login-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        code: cleanCode,
        password
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid or expired verification code.');
    }

    // Establish Supabase client session if server returned active session tokens
    if (data.session?.access_token && data.session?.refresh_token) {
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        if (!sessionErr && sessionData?.session) {
          setSession(sessionData.session);
          setUser(sessionData.user);
          if (sessionData.user?.id) {
            await fetchProfile(sessionData.user.id);
          }
          return data;
        }
      } catch (sessErr) {
        console.warn('setSession notice, falling back to client signIn:', sessErr);
      }
    }

    // Direct client-side sign-in ensures localStorage persistence & active RLS
    if (password) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });
      if (authError) {
        console.error('Client sign-in error after code verification:', authError);
        throw authError;
      }
      setSession(authData.session);
      setUser(authData.user);
      if (authData.user?.id) {
        await fetchProfile(authData.user.id);
      }
    }

    return data;
  }

  /**
   * Built-in Supabase Password Reset Request
   */
  async function resetPassword(email) {
    const callbackUrl = `${window.location.origin}/auth/callback?type=recovery`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl
    });
    if (error) throw error;
    return data;
  }

  /**
   * Update password for an authenticated recovery session
   */
  async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setProfile(null);
  }

  /**
   * Signs in or registers a clinician via Google Identity Services.
   * Tries direct Supabase signInWithIdToken first, and falls back to /api/auth/google
   * with OTP session generation to guarantee 100% successful authentication.
   */
  async function signInWithGoogle(credential) {
    if (!credential) {
      throw new Error('Google credential token was not received.');
    }

    try {
      setLoading(true);

      // 1. Try Supabase built-in ID token verification
      try {
        const { data: idTokenData, error: idTokenErr } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '419199290607-c3c3unjgc7jgmjgluegoruca3f4e139j.apps.googleusercontent.com'
        });

        if (!idTokenErr && idTokenData?.session) {
          setSession(idTokenData.session);
          setUser(idTokenData.user);
          if (idTokenData.user?.id) {
            await fetchProfile(idTokenData.user.id);
          }
          return idTokenData;
        }
      } catch (directErr) {
        console.warn('Supabase signInWithIdToken notice:', directErr?.message);
      }

      // 2. Verified backend fallback: /api/auth/google establishes confirmed account & session
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate with Google.');
      }

      // If server returned a hashed token, activate the session on client via verifyOtp
      if (data.tokenHash) {
        const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: data.tokenHash,
          type: 'email'
        });

        if (!verifyErr && verifyData?.session) {
          setSession(verifyData.session);
          setUser(verifyData.user);
          if (verifyData.user?.id) {
            await fetchProfile(verifyData.user.id);
          }
          return verifyData;
        }
      }

      return data;
    } finally {
      setLoading(false);
    }
  }

  const value = {
    session,
    user,
    profile,
    token: session?.access_token || null,
    loading,
    isConfigured: isSupabaseConfigured,
    isEmailVerified: Boolean(user?.email_confirmed_at),
    signIn,
    signInWithGoogle,
    initiateTwoStepLogin,
    completeTwoStepLogin,
    signUp,
    signOut,
    verifyOtpCode,
    resendVerificationEmail,
    resetPassword,
    updatePassword,
    refreshProfile: () => user && fetchProfile(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
