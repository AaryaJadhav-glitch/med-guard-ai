import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, AlertCircle, Lock, Mail, Building, User } from 'lucide-react';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('physician');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    // 1. Validation
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All required fields must be completed.');
      return;
    }

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid clinical email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long for clinical data security.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create account & generate 3-letter + 3-number OTP code
      const result = await signUp({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        organization: organization.trim(),
        role
      });

      // Strict requirement: User MUST NOT get direct access to the dashboard.
      // Redirect to the dedicated email verification screen to enter the OTP code.
      const queryParams = new URLSearchParams({
        email: email.trim().toLowerCase()
      });
      if (result?.devCode) {
        queryParams.set('devCode', result.devCode);
      }

      navigate(`/verify-email?${queryParams.toString()}`);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Unable to complete registration. Please try again.');
    } finally {
      setLoading(false);
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

        {/* Registration Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Clinician Registration</h2>
            <p className="text-xs text-slate-500 mt-1">
              Create an isolated clinician profile to begin evaluating medication combinations.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name & Title"
              required
              placeholder="e.g. Dr. Sarah Jenkins, MD"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Hospital / Practice Organization"
              placeholder="e.g. Memorial Hospital Health Network"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />

            <Select
              label="Clinical Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'physician', label: 'Attending Physician / Doctor (MD/DO)' },
                { value: 'pharmacist', label: 'Clinical Pharmacist (PharmD)' },
                { value: 'nurse_practitioner', label: 'Nurse Practitioner (NP/APRN)' },
                { value: 'physician_assistant', label: 'Physician Assistant (PA)' },
                { value: 'healthcare_professional', label: 'Healthcare Professional' }
              ]}
            />

            <Input
              label="Work Email"
              type="email"
              required
              placeholder="clinician@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              loading={loading}
              icon={UserCheck}
            >
              Create Account
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">Or register with</span>
            </div>
          </div>

          <GoogleSignInButton
            mode="signup"
            onSuccess={() => {
              navigate('/dashboard', { replace: true });
            }}
            onError={(errMsg) => setError(errMsg)}
          />

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
