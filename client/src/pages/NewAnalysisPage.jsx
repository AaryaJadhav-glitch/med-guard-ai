import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldAlert,
  Plus,
  AlertCircle,
  Stethoscope,
  Pill,
  Users,
  CheckCircle2,
  FileCheck,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { LoadingSpinner, ErrorBanner } from '../components/ui/Feedback';
import {
  MedicationInputRow,
  AnalysisOptionsBox,
  ClinicalDisclaimerCheckbox
} from '../components/analysis/AnalysisComponents';
import { RiskSummary } from '../components/analysis/RiskSummary';
import { RiskAlert } from '../components/analysis/RiskAlert';

export function NewAnalysisPage() {
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || '';
  const { token } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // New medications list
  const [newMedications, setNewMedications] = useState([
    {
      name: '',
      strength: '',
      dose: '',
      frequency: '',
      route: 'Oral',
      duration: '',
      indication: '',
      notes: ''
    }
  ]);

  // Checks modules
  const [checks, setChecks] = useState({
    drugInteractions: true,
    allergies: true,
    contraindications: true,
    duplicateTherapy: true,
    doseConcerns: true,
    monitoring: true
  });

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [disclaimerError, setDisclaimerError] = useState('');

  // Analysis result state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  // Load patients list
  useEffect(() => {
    async function loadPatients() {
      if (!token) return;
      try {
        setLoadingPatients(true);
        const res = await api.getPatients(token);
        const pts = res.patients || [];
        setPatients(pts);
        if (initialPatientId) {
          setSelectedPatientId(initialPatientId);
        } else if (pts.length > 0) {
          setSelectedPatientId(pts[0].id);
        }
      } catch (err) {
        console.error('Failed to load patient options:', err);
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, [token, initialPatientId]);

  // Fetch full details for selected patient
  useEffect(() => {
    async function loadPatientDetails() {
      if (!token || !selectedPatientId) {
        setSelectedPatient(null);
        return;
      }
      try {
        const res = await api.getPatient(token, selectedPatientId);
        setSelectedPatient(res.patient);
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      }
    }
    loadPatientDetails();
  }, [token, selectedPatientId]);

  const handleMedicationChange = (index, field, value) => {
    const updated = [...newMedications];
    updated[index][field] = value;
    setNewMedications(updated);
  };

  const handleAddMedication = () => {
    setNewMedications([
      ...newMedications,
      {
        name: '',
        strength: '',
        dose: '',
        frequency: '',
        route: 'Oral',
        duration: '',
        indication: '',
        notes: ''
      }
    ]);
  };

  const handleRemoveMedication = (index) => {
    if (newMedications.length > 1) {
      setNewMedications(newMedications.filter((_, i) => i !== index));
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedPatientId) {
      setAnalysisError('Please select a patient before analyzing medications.');
      return;
    }

    const validMeds = newMedications.filter(m => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      setAnalysisError('Please enter at least one newly prescribed medication name.');
      return;
    }

    if (!disclaimerAccepted) {
      setDisclaimerError('You must acknowledge the clinical decision support disclaimer to proceed.');
      return;
    }

    setDisclaimerError('');
    setAnalysisError('');
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const payload = {
        patientId: selectedPatientId,
        newMedications: validMeds,
        checks,
        disclaimerAccepted: true
      };

      const res = await api.runAnalysis(token, payload);
      setAnalysisResult(res);

      // Scroll smoothly down to the safety report
      setTimeout(() => {
        const reportEl = document.getElementById('safety-report-section');
        if (reportEl) reportEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Analysis execution error:', err);
      setAnalysisError(err.message || 'Unable to complete medication safety screening.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-teal-600" />
            <span>Medication Safety Screening</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate newly proposed medicines against patient allergies, medical conditions, and active therapies.
          </p>
        </div>

        {selectedPatient && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/patients/${selectedPatient.id}`)}
              icon={Users}
            >
              View Patient Chart
            </Button>
          </div>
        )}
      </div>

      {analysisError && <ErrorBanner message={analysisError} />}

      {/* Patient Selection Card */}
      <Card>
        <CardHeader
          title="1. Patient Profile Selection"
          subtitle="Choose the patient whose existing medical chart will be screened"
        />
        <CardContent className="p-6 space-y-4">
          {loadingPatients ? (
            <LoadingSpinner message="Loading patient list..." size="sm" />
          ) : patients.length === 0 ? (
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>No patients available. Please create a patient record first.</span>
              <Button size="sm" onClick={() => navigate('/patients/new')} icon={Plus}>
                Create Patient
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Select
                  label="Select Patient"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  options={patients.map(p => ({
                    value: p.id,
                    label: `${p.full_name} (${p.sex || 'N/A'}, DOB: ${p.date_of_birth || 'N/A'})`
                  }))}
                />
              </div>

              {selectedPatient && (
                <div className="md:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-3 gap-2">
                  <div>
                    <span className="font-bold text-slate-700 block">Allergies:</span>
                    <span className="text-slate-600">
                      {selectedPatient.allergies?.length
                        ? selectedPatient.allergies.map(a => a.allergen).join(', ')
                        : 'None documented (NKDA)'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Conditions:</span>
                    <span className="text-slate-600">
                      {selectedPatient.medical_conditions?.length
                        ? selectedPatient.medical_conditions.map(c => c.condition_name).join(', ')
                        : 'None documented'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Active Medications:</span>
                    <span className="text-slate-600">
                      {selectedPatient.medications?.filter(m => m.active)?.length
                        ? selectedPatient.medications.filter(m => m.active).map(m => m.name).join(', ')
                        : 'None active'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 2: New Medications Entry */}
        <Card>
          <CardHeader
            title="2. Proposed New Prescription(s)"
            subtitle="Add one or multiple newly prescribed medications to evaluate"
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddMedication}
                icon={Plus}
              >
                Add Another Medicine
              </Button>
            }
          />
          <CardContent className="p-6 space-y-4">
            {newMedications.map((med, index) => (
              <MedicationInputRow
                key={index}
                index={index}
                medication={med}
                onChange={(field, val) => handleMedicationChange(index, field, val)}
                onRemove={() => handleRemoveMedication(index)}
                canRemove={newMedications.length > 1}
              />
            ))}
          </CardContent>
        </Card>

        {/* Step 3: Analysis Check Options */}
        <AnalysisOptionsBox checks={checks} onChange={setChecks} />

        {/* Step 4: Clinical Disclaimer Acceptance */}
        <ClinicalDisclaimerCheckbox
          checked={disclaimerAccepted}
          onChange={(val) => {
            setDisclaimerAccepted(val);
            if (val) setDisclaimerError('');
          }}
          error={disclaimerError}
        />

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            loading={analyzing}
            disabled={analyzing}
            icon={Sparkles}
            className="w-full sm:w-auto shadow-lg"
          >
            {analyzing ? 'Evaluating Clinical Medication Safety...' : 'Run Medication Safety Analysis'}
          </Button>
        </div>
      </form>

      {/* Loading Animation during Analysis */}
      {analyzing && (
        <Card className="p-8 text-center bg-teal-50/40 border-teal-200">
          <LoadingSpinner
            message="Analyzing drug-drug interactions, beta-lactam cross-reactivity, and organ contraindications..."
            size="lg"
          />
          <p className="text-xs text-slate-500 mt-3 max-w-md mx-auto">
            Med-Guard AI is constructing structured clinical context and querying the clinical safety engine.
          </p>
        </Card>
      )}

      {/* Step 5: Rendered Clinical Safety Report */}
      {analysisResult && (
        <div id="safety-report-section" className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-600" />
              <span>Medication Safety Assessment Report</span>
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/analysis/${analysisResult.analysisId}`)}
              icon={ArrowRight}
            >
              View Saved Analysis Record
            </Button>
          </div>

          {/* Overall Risk Summary Banner */}
          <RiskSummary
            result={analysisResult.result}
            patientName={analysisResult.patient?.fullName}
            timestamp={analysisResult.createdAt}
          />

          {/* Alerts Breakdown List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Identified Clinical Advisory Items ({analysisResult.result.alerts?.length || 0})
            </h3>

            {analysisResult.result.alerts?.map((alert, idx) => (
              <RiskAlert key={idx} alert={alert} />
            ))}
          </div>

          {/* Data Limitations Card */}
          {analysisResult.result.dataLimitations?.length > 0 && (
            <Card className="bg-slate-50/60 border-slate-200">
              <CardContent className="p-4 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Assessment Boundary & Evidence Limitations:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  {analysisResult.result.dataLimitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
