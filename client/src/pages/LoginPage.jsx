import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, ArrowRight, AlertCircle, RefreshCw, CheckCircle2, KeyRound, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Auth context
  const { initiateTwoStepLogin, completeTwoStepLogin, resendVerificationEmail, resetPassword, isConfigured } = useAuth();

  // Form State: 'credentials' | 'two_step'
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState(searchParams.get('code') || searchParams.get('devCode') || '');
  const [devCode, setDevCode] = useState('');

  // Status and feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resend OTP state
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // 'success' | 'error' | null
  const [resendMessage, setResendMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const otpInputRef = useRef(null);
  const from = location.state?.from?.pathname || '/dashboard';

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus OTP input when switching to two_step
  useEffect(() => {
    if (step === 'two_step' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  /**
   * Step 1: Validate credentials and trigger Two-Step Verification OTP to Gmail
   */
  async function handleCredentialsSubmit(e) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Please provide your clinical account email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await initiateTwoStepLogin({ email: cleanEmail, password });

      // Save dev code if provided in dev mode
      if (res?.devCode) {
        setDevCode(res.devCode);
      }

      setStep('two_step');
      setCooldown(30);
      setSuccessMessage(`A 6-character verification code has been sent to ${cleanEmail}.`);
    } catch (err) {
      console.error('Login initiation error:', err);
      setError(err.message || 'Invalid credentials. Please verify your clinical email and password.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Step 2: Validate 6-character OTP (3 letters + 3 numbers) and log in directly
   */
  async function handleOtpSubmit(e) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.replace(/[\s-]/g, '').trim().toUpperCase();

    if (!cleanOtp) {
      setError('Please enter the 6-character verification code sent to your Gmail.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('Verification code must be exactly 6 characters (3 letters and 3 numbers, e.g. MGD492).');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('Verifying code & completing clinical sign in...');

      await completeTwoStepLogin({
        email: cleanEmail,
        code: cleanOtp,
        password
      });

      setSuccessMessage('Verification successful! Access granted to Med-Guard AI.');

      // Immediate redirect to dashboard
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Invalid or expired verification code. Please request a new code.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Resend fresh 6-character OTP to user's Gmail
   */
  async function handleResendCode() {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || cooldown > 0 || resending) return;

    try {
      setResending(true);
      setResendStatus(null);
      setResendMessage('');
      setError('');

      const res = await resendVerificationEmail(targetEmail);

      setResendStatus('success');
      setResendMessage('A fresh verification code has been sent to your Gmail.');
      setCooldown(30);

      if (res?.devCode) {
        setDevCode(res.devCode);
        setOtpCode(res.devCode);
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      setResendStatus('error');
      setResendMessage(
        err.message?.includes('rate limit')
          ? 'Too many attempts. Please wait a moment before trying again.'
          : 'Unable to resend verification code. Please try again.'
      );
    } finally {
      setResending(false);
    }
  }

  /**
   * Sample Clinician Autofill for quick testing
   */
  function handleFillDemo() {
    setEmail('vighneshkore2@gmail.com');
    setPassword('ClinicianSecure123!');
  }

  /**
   * Password Reset Request
   */
  async function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your account email.');
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError('');
      setForgotMessage('');

      await resetPassword(forgotEmail.trim().toLowerCase());
      setForgotMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      setForgotError(err.message || 'Unable to request password reset. Please try again.');
    } finally {
      setForgotLoading(false);
    }
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
            Med - Guard <span className="text-teal-400">AI</span>
          </h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-teal-300/80 mt-1">
            Clinical Safety & Interaction Prevention
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 transition-all duration-300">
          {/* STEP 1: Enter Credentials */}
          {step === 'credentials' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Clinician Sign In</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your credentials. A secure two-step verification code will be sent to your Gmail.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setShowForgotModal(true);
                      }}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full justify-center"
                  loading={loading}
                  icon={ArrowRight}
                >
                  Proceed with Two-Step Verification
                </Button>

                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="w-full py-1.5 text-xs text-slate-500 hover:text-teal-700 underline text-center"
                >
                  Autofill Sample Clinician Credentials
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">Or continue with</span>
                  </div>
                </div>

                <GoogleSignInButton
                  mode="signin"
                  onSuccess={() => {
                    setSuccessMessage('Google verification successful! Access granted to Med-Guard AI.');
                    setTimeout(() => {
                      navigate(from, { replace: true });
                    }, 500);
                  }}
                  onError={(errMsg) => setError(errMsg)}
                />
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  Don't have a clinician account?{' '}
                  <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
                    Register here
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* STEP 2: Two-Step Verification (OTP sent to Gmail) */}
          {step === 'two_step' && (
            <div className="text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-gradient-to-tr from-teal-50 to-emerald-50 border-2 border-teal-200 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-1">Two-Step Verification</h2>
              <p className="text-xs text-slate-600 mb-3">
                A 6-character code (3 letters + 3 numbers) was sent to your Gmail:
              </p>

              {/* Target Email Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200/80 rounded-xl text-xs font-semibold text-teal-900 mb-4 max-w-full break-all">
                <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{email}</span>
              </div>

              {/* Development Mode Quick Helper */}
              {devCode && (
                <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left flex items-center justify-between text-xs text-amber-900">
                  <div>
                    <span className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Verification Code:
                    </span>
                    <span className="font-mono font-bold tracking-widest text-slate-900 text-sm">{devCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devCode)}
                    className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-semibold rounded-lg text-[11px] transition-colors"
                  >
                    Paste Code
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {resendStatus === 'success' && (
                <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2 text-xs text-teal-800 text-left">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{resendMessage}</span>
                </div>
              )}

              {resendStatus === 'error' && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{resendMessage}</span>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Enter Verification Code</label>
                    <span className="text-[11px] text-slate-400 font-mono">e.g. MGD492</span>
                  </div>
                  <input
                    ref={otpInputRef}
                    type="text"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="ABC123"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3.5 text-center tracking-[0.45em] font-mono text-2xl font-extrabold border-2 border-slate-300 focus:border-teal-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/20 text-slate-900 uppercase transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Check your Gmail inbox or spam folder. Code is valid for 15 minutes.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full justify-center text-sm py-3"
                  loading={loading}
                  icon={ShieldCheck}
                >
                  Verify Code & Access Dashboard
                </Button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center text-xs"
                  onClick={handleResendCode}
                  disabled={resending || cooldown > 0}
                  icon={RefreshCw}
                >
                  {resending
                    ? 'Sending New Code...'
                    : cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : 'Resend Verification Code'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError('');
                    setSuccessMessage('');
                    setOtpCode('');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to email / password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Safety Disclaimer Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm mx-auto leading-relaxed">
          Med - Guard AI provides clinical decision support. Prescribing decisions require independent clinical verification.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500">Enter your email to receive recovery instructions</p>
              </div>
            </div>

            {forgotMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{forgotMessage}</span>
              </div>
            )}

            {forgotError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {!forgotMessage ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  required
                  placeholder="clinician@hospital.org"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={forgotLoading}
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>
            ) : (
              <div className="pt-2">
                <Button
                  className="w-full"
                  onClick={() => setShowForgotModal(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
