import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function AuthCallbackPage() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        setLoading(true);
        setError('');

        // 1. Check if Supabase passed an error directly in URL parameters or hash
        const errorDescription =
          searchParams.get('error_description') ||
          new URLSearchParams(window.location.hash.replace('#', '?')).get('error_description');

        if (errorDescription) {
          throw new Error(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        }

        // 2. Determine if this callback is for password recovery
        const type =
          searchParams.get('type') ||
          new URLSearchParams(window.location.hash.replace('#', '?')).get('type');

        if (type === 'recovery') {
          if (isMounted) setIsRecovery(true);
        }

        // 3. Supabase Auth client automatically extracts tokens from hash or PKCE query codes.
        // Let's exchange code if present or verify active session.
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('exchangeCodeForSession notice:', exchangeError.message);
          }
        }

        // Fetch the active session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          // Verify actual verification status returned by Supabase
          if (session.user.email_confirmed_at) {
            if (isMounted) setVerified(true);
          } else {
            throw new Error('Your email verification could not be completed. Please request a new verification link.');
          }
        } else {
          // If no session yet, listen once for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, eventSession) => {
            if (eventSession?.user?.email_confirmed_at) {
              if (isMounted) {
                setVerified(true);
                setLoading(false);
              }
              subscription?.unsubscribe();
            }
          });

          // Timeout fallback if no session received
          setTimeout(() => {
            if (isMounted && loading) {
              // Check if URL has access_token in hash
              const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
              if (hashParams.get('access_token')) {
                setVerified(true);
              } else {
                setError('Verification link expired or already used. Please sign in or request a new link.');
              }
              setLoading(false);
            }
          }, 3000);
          return;
        }
      } catch (err) {
        console.error('Callback error:', err);
        if (isMounted) {
          setError(err.message || 'Verification link expired or invalid.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  async function handlePasswordResetSubmit(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;
      setPasswordUpdated(true);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  // Handle continuing to login: sign out any temporary token so user performs clean verified login
  async function handleContinueToLogin() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout warning:', err);
    }
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl shadow-xl text-white mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Med-Guard <span className="text-teal-400">AI</span>
          </h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-teal-300/80 mt-1">
            Clinical Safety & Interaction Prevention
          </p>
        </div>

        {/* Callback Status Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 text-center">
          {loading && (
            <div className="py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
              <h2 className="text-lg font-bold text-slate-800">Verifying Your Credentials...</h2>
              <p className="text-xs text-slate-500">
                Please wait while we validate your clinical verification token with Supabase Auth.
              </p>
            </div>
          )}

          {!loading && isRecovery && !passwordUpdated && (
            <div>
              <div className="w-16 h-16 bg-teal-50 border-2 border-teal-200 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Set New Password</h2>
              <p className="text-xs text-slate-500 mb-6">
                Enter your new clinical account password to restore access.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Update Password & Continue
                </Button>
              </form>
            </div>
          )}

          {!loading && isRecovery && passwordUpdated && (
            <div className="py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Password Reset Complete</h2>
              <p className="text-xs text-slate-600">
                Your password has been updated successfully. You can now sign in with your new credentials.
              </p>
              <Button onClick={handleContinueToLogin} className="w-full mt-4" icon={ArrowRight}>
                Continue to Login
              </Button>
            </div>
          )}

          {!loading && !isRecovery && verified && (
            <div className="py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Email Verified Successfully
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Your email has been verified.
                <br />
                You can now sign in to <span className="font-semibold text-slate-800">Med-Guard AI</span>.
              </p>

              <div className="pt-4">
                <Button
                  onClick={handleContinueToLogin}
                  className="w-full justify-center"
                  icon={ArrowRight}
                >
                  Continue to Login
                </Button>
              </div>
            </div>
          )}

          {!loading && !isRecovery && !verified && error && (
            <div className="py-4 space-y-4">
              <div className="w-16 h-16 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>

              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 text-left">
                {error}
              </p>

              <div className="space-y-2 pt-2">
                <Link
                  to="/verify-email"
                  className="inline-block w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  Resend Verification Email
                </Link>
                <Link
                  to="/login"
                  className="inline-block w-full py-2 px-4 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Safety Disclaimer Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm mx-auto leading-relaxed">
          Med-Guard AI provides clinical decision support. Prescribing decisions require independent clinical verification.
        </p>
      </div>
    </div>
  );
}
