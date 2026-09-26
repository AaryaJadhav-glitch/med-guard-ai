import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryEmail = searchParams.get('email') || '';
  const initialDevCode = searchParams.get('devCode') || '';
  const isUnverifiedAttempt = searchParams.get('unverified') === 'true';

  const [email, setEmail] = useState(queryEmail);
  const [code, setCode] = useState(initialDevCode);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { verifyOtpCode, resendVerificationEmail } = useAuth();

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

  async function handleVerify(e) {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered clinical email.');
      return;
    }

    const cleanCode = code.replace(/[\s-]/g, '').trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter the 6-character verification code.');
      return;
    }

    if (cleanCode.length !== 6) {
      setError('Verification code must be exactly 6 characters (3 letters and 3 numbers).');
      return;
    }

    try {
      setVerifying(true);
      setError('');

      await verifyOtpCode(email.trim().toLowerCase(), cleanCode);
      setIsVerified(true);
      setSuccessMessage('Email verified successfully! Your Med-Guard AI account is activated.');
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code. Please request a new code.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!email.trim() || cooldown > 0 || resending) return;

    try {
      setResending(true);
      setError('');
      setSuccessMessage('');

      const res = await resendVerificationEmail(email.trim().toLowerCase());

      setSuccessMessage('A fresh verification code has been sent. Please check your inbox.');
      setCooldown(30); // 30-second cooldown

      // If development environment returned devCode, populate for convenience
      if (res?.devCode) {
        setCode(res.devCode);
      }
    } catch (err) {
      console.error('Failed to resend verification code:', err);
      setError(err.message || 'Unable to resend verification code. Please try again.');
    } finally {
      setResending(false);
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

        {/* Verification Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8">
          {isVerified ? (
            /* Success State */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Email Verified Successfully</h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Your email has been verified.
                <br />
                You can now sign in to <span className="font-semibold text-slate-800">Med - Guard AI</span>.
              </p>

              <div className="pt-2">
                <Button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full justify-center"
                  icon={ArrowRight}
                >
                  Continue to Login
                </Button>
              </div>
            </div>
          ) : (
            /* Code Entry State */
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-teal-50 border-2 border-teal-200 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isUnverifiedAttempt ? 'Email Not Verified' : 'Enter Verification Code'}
                </h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  We've sent a 6-character code (3 letters and 3 numbers) to:
                  {email ? (
                    <span className="block mt-1 font-semibold text-teal-700 break-all text-xs">
                      {email}
                    </span>
                  ) : (
                    ' your registered email address'
                  )}
                </p>
              </div>

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

              <form onSubmit={handleVerify} className="space-y-4">
                {!queryEmail && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="clinician@hospital.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Verification Code (3 Letters + 3 Numbers)
                    </label>
                    <span className="text-[11px] text-slate-400">e.g. MED482</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={7}
                    placeholder="ABC123"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 text-center tracking-[0.4em] font-mono text-xl font-bold border-2 border-slate-200 focus:border-teal-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900 uppercase"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 text-center">
                    Check your email inbox or spam folder for the code sent by Med - Guard AI.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full justify-center"
                  loading={verifying}
                  icon={ArrowRight}
                >
                  Verify Code & Activate Account
                </Button>
              </form>

              <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center text-xs"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0 || !email}
                  icon={RefreshCw}
                >
                  {resending
                    ? 'Sending New Code...'
                    : cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : 'Resend Verification Code'}
                </Button>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Safety Disclaimer Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm mx-auto leading-relaxed">
          Med - Guard AI provides clinical decision support. Prescribing decisions require independent clinical verification.
        </p>
      </div>
    </div>
  );
}
