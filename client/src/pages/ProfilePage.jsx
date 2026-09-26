import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Mail, Building, Stethoscope, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorBanner } from '../components/ui/Feedback';

export function ProfilePage() {
  const { user, profile, token, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setOrganization(profile.organization || '');
    }
  }, [profile]);

  async function handleSave(e) {
    e.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      setError('');
      await api.updateProfile(token, {
        fullName: fullName.trim(),
        organization: organization.trim()
      });
      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update clinical profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-teal-600" />
          <span>Clinician Profile</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your practitioner identity, facility association, and authenticated account information.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <Card>
        <CardHeader
          title="Practitioner Details"
          subtitle="Identity attached to safety analysis reports and clinical audit logs"
        />
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Full Name & Clinical Credentials"
              required
              placeholder="e.g. Dr. Sarah Jenkins, MD"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Health System / Practice Organization"
              placeholder="e.g. MetroHealth General Hospital"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Clinical Role
              </label>
              <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 capitalize border border-slate-200">
                {profile?.role ? profile.role.replace('_', ' ') : 'Healthcare Professional'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Account Email
              </label>
              <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-mono text-slate-700 border border-slate-200">
                {user?.email || 'N/A'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Email is managed through your Supabase Auth provider.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile updated successfully.
                </span>
              ) : <div />}

              <Button type="submit" loading={saving} icon={Save}>
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security notice */}
      <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 block mb-0.5">Strict Data Isolation</span>
          Your patient profiles, allergy registries, and AI safety evaluations are tied exclusively to your authenticated user account via PostgreSQL Row Level Security (RLS). No other clinician can view or access your records.
        </div>
      </div>
    </div>
  );
}
