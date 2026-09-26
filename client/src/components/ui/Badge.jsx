import React from 'react';

const SEVERITY_STYLES = {
  critical: 'bg-rose-100 text-rose-800 border-rose-200 ring-rose-500/20',
  high: 'bg-orange-100 text-orange-800 border-orange-200 ring-orange-500/20',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200 ring-amber-500/20',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200 ring-emerald-500/20',
  informational: 'bg-sky-100 text-sky-800 border-sky-200 ring-sky-500/20',
  default: 'bg-slate-100 text-slate-800 border-slate-200'
};

const CATEGORY_LABELS = {
  drug_interaction: 'Drug-Drug Interaction',
  allergy: 'Allergy Conflict',
  contraindication: 'Contraindication',
  duplicate_therapy: 'Duplicate Therapy',
  dose_concern: 'Dosing Concern',
  monitoring: 'Monitoring Protocol',
  patient_specific: 'Patient-Specific Risk'
};

export function RiskBadge({ severity = 'informational', className = '', size = 'md' }) {
  const norm = (severity || 'informational').toLowerCase();
  const style = SEVERITY_STYLES[norm] || SEVERITY_STYLES.default;
  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold tracking-wide uppercase';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ring-1 font-medium ${style} ${sizeStyle} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        norm === 'critical' ? 'bg-rose-600 animate-ping' :
        norm === 'high' ? 'bg-orange-600' :
        norm === 'moderate' ? 'bg-amber-600' :
        norm === 'low' ? 'bg-emerald-600' : 'bg-sky-600'
      }`} />
      <span>{norm}</span>
    </span>
  );
}

export function CategoryBadge({ category = '', className = '' }) {
  const label = CATEGORY_LABELS[category] || category.replace('_', ' ');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      {label}
    </span>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const style = SEVERITY_STYLES[variant] || SEVERITY_STYLES.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {children}
    </span>
  );
}
