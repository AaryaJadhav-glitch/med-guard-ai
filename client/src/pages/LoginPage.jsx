import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your clinical account email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signIn({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleFillDemo() {
    setEmail('dr.jenkins@hospital.org');
    setPassword('ClinicianSecure123!');
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

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Clinician Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access your isolated patient safety records.
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Supabase Cloud Notice:</span> Set your <code className="font-mono text-teal-800">VITE_SUPABASE_URL</code> and <code className="font-mono text-teal-800">VITE_SUPABASE_ANON_KEY</code> in <code className="font-mono">.env</code> to connect your live Supabase project.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="clinician@healthsystem.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <Input
                label="Password"
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
              className="w-full"
              loading={loading}
              icon={ArrowRight}
            >
              Sign In to Med-Guard
            </Button>

            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-1.5 text-xs text-slate-500 hover:text-teal-700 underline text-center"
            >
              Autofill Sample Clinician Credentials
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don't have a clinician account?{' '}
              <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Safety Disclaimer Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm mx-auto leading-relaxed">
          Med-Guard AI provides clinical decision support. Prescribing decisions require independent clinical verification.
        </p>
      </div>
    </div>
  );
}
