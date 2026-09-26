import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/Feedback';

export function PatientEditPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState('unknown');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.getPatient(token, id);
        const p = res.patient;
        setFullName(p.full_name || '');
        setDateOfBirth(p.date_of_birth || '');
        setSex(p.sex || 'unknown');
        setHeightCm(p.height_cm ? String(p.height_cm) : '');
        setWeightKg(p.weight_kg ? String(p.weight_kg) : '');
        setMedicalNotes(p.medical_notes || '');
      } catch (err) {
        setError(err.message || 'Unable to load patient data');
      } finally {
        setLoading(false);
      }
    }
    if (token && id) loadData();
  }, [token, id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Patient name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.updatePatient(token, id, {
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth || null,
        sex,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        medicalNotes: medicalNotes.trim() || null
      });
      navigate(`/patients/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update patient profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading patient details..." className="py-20" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200/80">
        <button
          onClick={() => navigate(`/patients/${id}`)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Edit Patient Demographics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update physiological parameters and chart notes for {fullName}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Biological Sex"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'other', label: 'Other' },
                  { value: 'unknown', label: 'Unknown' }
                ]}
              />
              <Input
                label="Height (cm)"
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>

            <Textarea
              label="Clinical Notes / Medical History"
              rows={4}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => navigate(`/patients/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving} icon={Save}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
