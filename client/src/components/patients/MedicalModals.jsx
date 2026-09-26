import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

export function AllergyFormModal({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  const [allergen, setAllergen] = useState(initialData?.allergen || '');
  const [reaction, setReaction] = useState(initialData?.reaction || '');
  const [severity, setSeverity] = useState(initialData?.severity || 'moderate');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allergen.trim()) {
      setError('Allergen name is required');
      return;
    }
    setError('');
    onSubmit({ allergen, reaction, severity, notes });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Allergy Record' : 'Record Patient Allergy'}
      subtitle="Document substance, adverse clinical reaction, and documented severity"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Allergen / Substance"
          required
          placeholder="e.g. Penicillin, Sulfonamides, Aspirin"
          value={allergen}
          onChange={(e) => setAllergen(e.target.value)}
          error={error}
        />

        <Input
          label="Clinical Reaction"
          placeholder="e.g. Anaphylaxis, Angioedema, Rash, Bronchospasm"
          value={reaction}
          onChange={(e) => setReaction(e.target.value)}
        />

        <Select
          label="Severity Level"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          options={[
            { value: 'mild', label: 'Mild (e.g. localized itching)' },
            { value: 'moderate', label: 'Moderate (e.g. generalized rash, urticaria)' },
            { value: 'severe', label: 'Severe (e.g. wheezing, hypotension)' },
            { value: 'life-threatening', label: 'Life-Threatening (e.g. anaphylactic shock)' },
            { value: 'unknown', label: 'Unknown / Unspecified' }
          ]}
        />

        <Textarea
          label="Clinical Notes / Circumstances"
          rows={2}
          placeholder="e.g. Reaction occurred within 30 minutes of oral administration in 2019"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Update Record' : 'Save Allergy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ConditionFormModal({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  const [conditionName, setConditionName] = useState(initialData?.condition_name || '');
  const [status, setStatus] = useState(initialData?.status || 'active');
  const [severity, setSeverity] = useState(initialData?.severity || 'moderate');
  const [diagnosisDate, setDiagnosisDate] = useState(initialData?.diagnosis_date || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!conditionName.trim()) {
      setError('Condition name is required');
      return;
    }
    setError('');
    onSubmit({
      conditionName,
      status,
      severity,
      diagnosisDate: diagnosisDate || null,
      notes
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Medical Condition' : 'Add Medical Condition'}
      subtitle="Document chronic and acute clinical diagnoses for contraindication analysis"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Condition / Diagnosis"
          required
          placeholder="e.g. Chronic Kidney Disease, Atrial Fibrillation"
          value={conditionName}
          onChange={(e) => setConditionName(e.target.value)}
          error={error}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Clinical Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'managed', label: 'Managed / Controlled' },
              { value: 'in_remission', label: 'In Remission' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'historical', label: 'Historical' }
            ]}
          />

          <Select
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={[
              { value: 'mild', label: 'Mild' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'severe', label: 'Severe' },
              { value: 'critical', label: 'Critical' },
              { value: 'unspecified', label: 'Unspecified' }
            ]}
          />
        </div>

        <Input
          label="Diagnosis Date"
          type="date"
          value={diagnosisDate}
          onChange={(e) => setDiagnosisDate(e.target.value)}
        />

        <Textarea
          label="Notes / Lab Values"
          rows={2}
          placeholder="e.g. eGFR 45 mL/min, Stage 3a CKD"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Update Condition' : 'Save Condition'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MedicationFormModal({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  const [name, setName] = useState(initialData?.name || '');
  const [genericName, setGenericName] = useState(initialData?.generic_name || '');
  const [brandName, setBrandName] = useState(initialData?.brand_name || '');
  const [strength, setStrength] = useState(initialData?.strength || '');
  const [dosageForm, setDosageForm] = useState(initialData?.dosage_form || 'Tablet');
  const [dose, setDose] = useState(initialData?.dose || '');
  const [frequency, setFrequency] = useState(initialData?.frequency || 'Once daily');
  const [route, setRoute] = useState(initialData?.route || 'Oral');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [active, setActive] = useState(initialData?.active ?? true);
  const [prescribingProvider, setPrescribingProvider] = useState(initialData?.prescribing_provider || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Medication name is required');
      return;
    }
    setError('');
    onSubmit({
      name,
      genericName: genericName || null,
      brandName: brandName || null,
      strength: strength || null,
      dosageForm: dosageForm || null,
      dose: dose || null,
      frequency: frequency || null,
      route: route || null,
      startDate: startDate || null,
      endDate: endDate || null,
      active,
      prescribingProvider: prescribingProvider || null,
      notes: notes || null
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Medication Record' : 'Record Existing Medication'}
      subtitle="Document active therapies to detect interactions and duplications"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Medication Name"
            required
            placeholder="e.g. Lisinopril, Warfarin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
          <Input
            label="Generic Name"
            placeholder="e.g. lisinopril"
            value={genericName}
            onChange={(e) => setGenericName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Strength"
            placeholder="e.g. 20 mg"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
          />
          <Input
            label="Dose"
            placeholder="e.g. 20 mg (1 tab)"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
          />
          <Select
            label="Dosage Form"
            value={dosageForm}
            onChange={(e) => setDosageForm(e.target.value)}
            options={[
              { value: 'Tablet', label: 'Tablet' },
              { value: 'Capsule', label: 'Capsule' },
              { value: 'Liquid / Solution', label: 'Liquid / Solution' },
              { value: 'Inhaler', label: 'Inhaler' },
              { value: 'Injection', label: 'Injection' },
              { value: 'Topical Cream/Patch', label: 'Topical / Patch' }
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Frequency"
            placeholder="e.g. Once daily, Twice daily"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />
          <Select
            label="Route"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            options={[
              { value: 'Oral', label: 'Oral (PO)' },
              { value: 'Sublingual', label: 'Sublingual (SL)' },
              { value: 'Intravenous', label: 'Intravenous (IV)' },
              { value: 'Subcutaneous', label: 'Subcutaneous (SC)' },
              { value: 'Inhalation', label: 'Inhalation' },
              { value: 'Topical', label: 'Topical' },
              { value: 'Ophthalmic', label: 'Ophthalmic' }
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Prescribing Clinician"
            placeholder="e.g. Dr. Sarah Jenkins"
            value={prescribingProvider}
            onChange={(e) => setPrescribingProvider(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="med-active-check"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
          />
          <label htmlFor="med-active-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Currently Active Prescription (Included in Interaction Screening)
          </label>
        </div>

        <Textarea
          label="Clinical Notes / Monitoring parameters"
          rows={2}
          placeholder="e.g. Hold if SBP < 100 or serum potassium > 5.2 mEq/L"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Update Medication' : 'Save Medication'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
