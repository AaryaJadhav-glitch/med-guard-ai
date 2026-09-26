import React from 'react';
import { Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Input, Select } from '../ui/Input';

export function MedicationInputRow({ index, medication, onChange, onRemove, canRemove }) {
  return (
    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 relative space-y-3 transition-colors hover:border-slate-300">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
          Proposed Medicine #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
            title="Remove medication"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <Input
            label="Medication Name"
            required
            placeholder="e.g. Amoxicillin, Ibuprofen, Clopidogrel"
            value={medication.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </div>
        <Input
          label="Strength"
          placeholder="e.g. 500 mg"
          value={medication.strength}
          onChange={(e) => onChange('strength', e.target.value)}
        />
        <Input
          label="Prescribed Dose"
          placeholder="e.g. 1 capsule, 10 mL"
          value={medication.dose}
          onChange={(e) => onChange('dose', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Frequency"
          placeholder="e.g. Every 8 hours, Once daily"
          value={medication.frequency}
          onChange={(e) => onChange('frequency', e.target.value)}
        />
        <Select
          label="Route of Admin"
          value={medication.route}
          onChange={(e) => onChange('route', e.target.value)}
          options={[
            { value: 'Oral', label: 'Oral (PO)' },
            { value: 'Intravenous', label: 'Intravenous (IV)' },
            { value: 'Subcutaneous', label: 'Subcutaneous (SC)' },
            { value: 'Inhalation', label: 'Inhalation' },
            { value: 'Sublingual', label: 'Sublingual' },
            { value: 'Topical', label: 'Topical' },
            { value: 'Ophthalmic', label: 'Ophthalmic' }
          ]}
        />
        <Input
          label="Treatment Duration"
          placeholder="e.g. 7 days, 14 days, Chronic"
          value={medication.duration}
          onChange={(e) => onChange('duration', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Intended Clinical Indication"
          placeholder="e.g. Community-acquired pneumonia, Acute joint pain"
          value={medication.indication}
          onChange={(e) => onChange('indication', e.target.value)}
        />
        <Input
          label="Special Prescriber Notes"
          placeholder="e.g. Take with food; monitor renal panel"
          value={medication.notes}
          onChange={(e) => onChange('notes', e.target.value)}
        />
      </div>
    </div>
  );
}

export function AnalysisOptionsBox({ checks, onChange }) {
  const toggle = (field) => {
    onChange({ ...checks, [field]: !checks[field] });
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
        Clinical Safety Screening Modules
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checks.drugInteractions}
            onChange={() => toggle('drugInteractions')}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
          />
          <div>
            <span className="font-semibold text-slate-800 block">Drug-Drug Interactions</span>
            <span className="text-[11px] text-slate-500">Screen existing & proposed combinations</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checks.allergies}
            onChange={() => toggle('allergies')}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
          />
          <div>
            <span className="font-semibold text-slate-800 block">Allergy & Cross-Reactivity</span>
            <span className="text-[11px] text-slate-500">Beta-lactams, NSAIDs, sulfa risks</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checks.contraindications}
            onChange={() => toggle('contraindications')}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
          />
          <div>
            <span className="font-semibold text-slate-800 block">Disease Contraindications</span>
            <span className="text-[11px] text-slate-500">CKD, hepatic, cardiac, respiratory</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checks.duplicateTherapy}
            onChange={() => toggle('duplicateTherapy')}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
          />
          <div>
            <span className="font-semibold text-slate-800 block">Duplicate Therapy</span>
            <span className="text-[11px] text-slate-500">Same ingredient or pharmacological class</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checks.doseConcerns}
            onChange={() => toggle('doseConcerns')}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
          />
          <div>
            <span className="font-semibold text-slate-800 block">Dose & Route Concerns</span>
            <span className="text-[11px] text-slate-500">Unusual frequency or route mismatch</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checks.monitoring}
            onChange={() => toggle('monitoring')}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
          />
          <div>
            <span className="font-semibold text-slate-800 block">Monitoring Protocols</span>
            <span className="text-[11px] text-slate-500">Labs, ECG, renal/electrolytes schedule</span>
          </div>
        </label>
      </div>
    </div>
  );
}

export function ClinicalDisclaimerCheckbox({ checked, onChange, error }) {
  return (
    <div className={`p-4 rounded-xl border ${error ? 'border-rose-300 bg-rose-50/40' : 'border-amber-200/80 bg-amber-50/40'} space-y-2`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="disclaimer-ack"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 mt-1 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
        />
        <label htmlFor="disclaimer-ack" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
          <span className="font-bold text-slate-900 block mb-0.5">
            Mandatory Prescriber Acknowledgment
          </span>
          "This tool provides AI-assisted medication safety information for professional review. It does not replace clinical judgment, official prescribing information, pharmacist review, or authoritative drug-interaction references."
        </label>
      </div>
      {error && (
        <p className="text-xs font-semibold text-rose-600 pl-7 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
