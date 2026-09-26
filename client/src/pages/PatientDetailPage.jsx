import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  ArrowLeft,
  Edit3,
  Trash2,
  Plus,
  ShieldAlert,
  Pill,
  AlertTriangle,
  HeartPulse,
  Activity,
  History,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, RiskBadge } from '../components/ui/Badge';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import {
  AllergyFormModal,
  ConditionFormModal,
  MedicationFormModal
} from '../components/patients/MedicalModals';

export function PatientDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState(null);

  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState(null);

  const [medicationModalOpen, setMedicationModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);

  const [deletePatientOpen, setDeletePatientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPatient();
  }, [id, token]);

  async function loadPatient() {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.getPatient(token, id);
      setPatient(data.patient);
    } catch (err) {
      console.error('Error fetching patient profile:', err);
      setError(err.message || 'Unable to load patient profile.');
    } finally {
      setLoading(false);
    }
  }

  // Allergy handlers
  async function handleSaveAllergy(allergyData) {
    try {
      setSubmitting(true);
      if (editingAllergy) {
        await api.updateAllergy(token, editingAllergy.id, allergyData);
      } else {
        await api.createAllergy(token, id, allergyData);
      }
      setAllergyModalOpen(false);
      setEditingAllergy(null);
      await loadPatient();
    } catch (err) {
      alert('Error saving allergy: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAllergy(allergyId) {
    if (!confirm('Remove this allergy record from the patient profile?')) return;
    try {
      await api.deleteAllergy(token, allergyId);
      await loadPatient();
    } catch (err) {
      alert('Failed to delete allergy: ' + err.message);
    }
  }

  // Condition handlers
  async function handleSaveCondition(conditionData) {
    try {
      setSubmitting(true);
      if (editingCondition) {
        await api.updateCondition(token, editingCondition.id, conditionData);
      } else {
        await api.createCondition(token, id, conditionData);
      }
      setConditionModalOpen(false);
      setEditingCondition(null);
      await loadPatient();
    } catch (err) {
      alert('Error saving condition: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCondition(conditionId) {
    if (!confirm('Remove this medical condition from profile?')) return;
    try {
      await api.deleteCondition(token, conditionId);
      await loadPatient();
    } catch (err) {
      alert('Failed to delete condition: ' + err.message);
    }
  }

  // Medication handlers
  async function handleSaveMedication(medData) {
    try {
      setSubmitting(true);
      if (editingMedication) {
        await api.updateMedication(token, editingMedication.id, medData);
      } else {
        await api.createMedication(token, id, medData);
      }
      setMedicationModalOpen(false);
      setEditingMedication(null);
      await loadPatient();
    } catch (err) {
      alert('Error saving medication: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleMedActive(med) {
    try {
      await api.updateMedication(token, med.id, { active: !med.active });
      await loadPatient();
    } catch (err) {
      alert('Failed to update medication status: ' + err.message);
    }
  }

  async function handleDeleteMedication(medId) {
    if (!confirm('Delete this medication from patient record?')) return;
    try {
      await api.deleteMedication(token, medId);
      await loadPatient();
    } catch (err) {
      alert('Failed to delete medication: ' + err.message);
    }
  }

  async function handleConfirmDeletePatient() {
    try {
      setSubmitting(true);
      await api.deletePatient(token, id);
      navigate('/patients');
    } catch (err) {
      alert('Failed to delete patient: ' + err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Retrieving patient chart and medical records..." size="lg" className="py-20" />;
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error || 'Patient not found'} onRetry={loadPatient} />
        <Button variant="secondary" onClick={() => navigate('/patients')} icon={ArrowLeft}>
          Back to Patient Roster
        </Button>
      </div>
    );
  }

  // Calculate age & BMI
  let age = null;
  if (patient.date_of_birth) {
    const dob = new Date(patient.date_of_birth);
    const diff = Date.now() - dob.getTime();
    age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  let bmi = null;
  if (patient.height_cm && patient.weight_kg) {
    const hM = patient.height_cm / 100;
    bmi = (patient.weight_kg / (hM * hM)).toFixed(1);
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/patients')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {patient.full_name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">
              Patient Chart • ID: <span className="font-mono text-slate-600">{patient.id.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/patients/${id}/edit`)}
            icon={Edit3}
            size="sm"
          >
            Edit Demographics
          </Button>

          <Button
            variant="danger"
            onClick={() => setDeletePatientOpen(true)}
            icon={Trash2}
            size="sm"
          >
            Delete Patient
          </Button>

          <Button
            onClick={() => navigate(`/analysis/new?patientId=${patient.id}`)}
            icon={ShieldAlert}
            size="sm"
          >
            Evaluate New Prescription
          </Button>
        </div>
      </div>

      {/* Patient Demographic & Vitals Summary Banner */}
      <Card className="bg-gradient-to-r from-white via-slate-50/50 to-teal-50/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Age</span>
              <span className="text-base font-bold text-slate-900">{age !== null ? `${age} years` : 'Unknown'}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sex</span>
              <span className="text-base font-bold text-slate-900 capitalize">{patient.sex || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
              <span className="text-base font-bold text-slate-900">{patient.date_of_birth || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Height</span>
              <span className="text-base font-bold text-slate-900">{patient.height_cm ? `${patient.height_cm} cm` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Weight</span>
              <span className="text-base font-bold text-slate-900">{patient.weight_kg ? `${patient.weight_kg} kg` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Calculated BMI</span>
              <span className="text-base font-bold text-teal-700">{bmi ? `${bmi} kg/m²` : 'N/A'}</span>
            </div>
          </div>

          {patient.medical_notes && (
            <div className="mt-4 pt-4 border-t border-slate-200/80 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Clinical Chart Notes:</span>
              <p className="text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">
                "{patient.medical_notes}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid of Medical Profile Details: Allergies, Conditions, Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documented Allergies Card */}
        <Card>
          <CardHeader
            title="Documented Allergies"
            subtitle="Substances causing adverse drug reactions or anaphylaxis"
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={Plus}
                onClick={() => {
                  setEditingAllergy(null);
                  setAllergyModalOpen(true);
                }}
              >
                Add Allergy
              </Button>
            }
          />
          <CardContent className="p-0 divide-y divide-slate-100">
            {patient.allergies?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No known drug allergies (NKDA) recorded for this patient.
              </div>
            ) : (
              patient.allergies?.map((allergy) => (
                <div key={allergy.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{allergy.allergen}</span>
                      <RiskBadge severity={allergy.severity === 'life-threatening' ? 'critical' : allergy.severity} size="sm" />
                    </div>
                    {allergy.reaction && (
                      <p className="text-xs text-rose-700 font-medium">
                        Reaction: {allergy.reaction}
                      </p>
                    )}
                    {allergy.notes && (
                      <p className="text-[11px] text-slate-500">{allergy.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingAllergy(allergy);
                        setAllergyModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAllergy(allergy.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Medical Conditions / History Card */}
        <Card>
          <CardHeader
            title="Medical Conditions & History"
            subtitle="Diagnoses evaluated during contraindication screening"
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={Plus}
                onClick={() => {
                  setEditingCondition(null);
                  setConditionModalOpen(true);
                }}
              >
                Add Condition
              </Button>
            }
          />
          <CardContent className="p-0 divide-y divide-slate-100">
            {patient.medical_conditions?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active medical conditions recorded.
              </div>
            ) : (
              patient.medical_conditions?.map((c) => (
                <div key={c.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{c.condition_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {c.status}
                      </span>
                    </div>
                    {c.diagnosis_date && (
                      <p className="text-[11px] text-slate-400">
                        Diagnosed: {c.diagnosis_date} • Severity: {c.severity}
                      </p>
                    )}
                    {c.notes && <p className="text-xs text-slate-600">{c.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingCondition(c);
                        setConditionModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCondition(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medication Profile Section (Full Width) */}
      <Card>
        <CardHeader
          title="Medication Profile (Existing Prescriptions)"
          subtitle="Currently active and historical therapies screened during interaction analysis"
          action={
            <Button
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingMedication(null);
                setMedicationModalOpen(true);
              }}
            >
              Add Existing Medication
            </Button>
          }
        />
        <CardContent className="p-0 divide-y divide-slate-100">
          {patient.medications?.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No existing medications recorded. Add existing prescriptions to screen for drug-drug interactions.
            </div>
          ) : (
            patient.medications?.map((m) => (
              <div key={m.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{m.name}</span>
                    {m.strength && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {m.strength}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleMedActive(m)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                        m.active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      {m.active ? '● Active Therapy' : 'Inactive / Historical'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    {m.dose && <span>Dose: {m.dose}</span>}
                    {m.frequency && <span>Frequency: {m.frequency}</span>}
                    {m.route && <span>Route: {m.route}</span>}
                    {m.prescribing_provider && <span>Prescriber: {m.prescribing_provider}</span>}
                  </div>

                  {m.notes && (
                    <p className="text-xs text-slate-500 italic mt-1">
                      Note: {m.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingMedication(m);
                      setMedicationModalOpen(true);
                    }}
                    icon={Edit3}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteMedication(m.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AllergyFormModal
        isOpen={allergyModalOpen}
        onClose={() => {
          setAllergyModalOpen(false);
          setEditingAllergy(null);
        }}
        onSubmit={handleSaveAllergy}
        initialData={editingAllergy}
        loading={submitting}
      />

      <ConditionFormModal
        isOpen={conditionModalOpen}
        onClose={() => {
          setConditionModalOpen(false);
          setEditingCondition(null);
        }}
        onSubmit={handleSaveCondition}
        initialData={editingCondition}
        loading={submitting}
      />

      <MedicationFormModal
        isOpen={medicationModalOpen}
        onClose={() => {
          setMedicationModalOpen(false);
          setEditingMedication(null);
        }}
        onSubmit={handleSaveMedication}
        initialData={editingMedication}
        loading={submitting}
      />

      <ConfirmDialog
        isOpen={deletePatientOpen}
        onClose={() => setDeletePatientOpen(false)}
        onConfirm={handleConfirmDeletePatient}
        title="Delete Patient Record?"
        message={`Are you sure you want to permanently delete ${patient.full_name}? All associated allergies, medications, and analysis history will be permanently deleted.`}
        confirmText="Confirm Permanent Delete"
        confirmVariant="danger"
        loading={submitting}
      />
    </div>
  );
}
