import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('physician');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredNotice, setRegisteredNotice] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please complete all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters for security compliance.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await signUp({
        email,
        password,
        fullName,
        organization
      });

      // If Supabase has email confirmation enabled
      if (data?.session) {
        navigate('/dashboard');
      } else {
        setRegisteredNotice(true);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check details.');
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
            Med-Guard <span className="text-teal-400">AI</span>
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

          {registeredNotice ? (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-sm space-y-3">
              <h4 className="font-bold text-teal-950">Registration Complete</h4>
              <p className="text-xs text-teal-800">
                Your account has been registered. If email confirmation is enabled on your Supabase project, please check your inbox to confirm, then sign in.
              </p>
              <Button className="w-full" onClick={() => navigate('/login')}>
                Proceed to Sign In
              </Button>
            </div>
          ) : (
            <>
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
                  label="Hospital / Clinic Organization"
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
                    { value: 'other_clinician', label: 'Healthcare Professional' }
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
                  label="Secure Password"
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                  icon={UserCheck}
                >
                  Create Clinician Account
                </Button>
              </form>
            </>
          )}

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
