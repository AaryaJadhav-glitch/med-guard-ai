import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserPlus, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function PatientNewPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState('unknown');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Patient full name is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth || null,
        sex,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        medicalNotes: medicalNotes.trim() || null
      };

      const response = await api.createPatient(token, payload);
      navigate(`/patients/${response.patient.id}`);
    } catch (err) {
      console.error('Patient creation error:', err);
      setError(err.message || 'Failed to create patient profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200/80">
        <button
          onClick={() => navigate('/patients')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-teal-600" />
            <span>Create New Patient Record</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register patient demographics and physical parameters for safe clinical dosing and clearance calculations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Patient Form Card */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Patient Demographics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Select
                  label="Biological Sex"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  options={[
                    { value: 'female', label: 'Female' },
                    { value: 'male', label: 'Male' },
                    { value: 'other', label: 'Other' },
                    { value: 'unknown', label: 'Unknown / Not Disclosed' }
                  ]}
                />

                <Input
                  label="Height (cm)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 165"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />

                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 68.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Clinical Overview & Relevant History
              </h3>
              <Textarea
                label="Baseline Medical Notes"
                rows={4}
                placeholder="Document baseline renal status, baseline vitals, pregnancy status, or high-risk history notes..."
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                helperText="Avoid entering government IDs or sensitive unneeded identifiers."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => navigate('/patients')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading} icon={ShieldCheck}>
                Save Patient Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
