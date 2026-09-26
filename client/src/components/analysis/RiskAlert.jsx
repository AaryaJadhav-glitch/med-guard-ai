import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldAlert,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { RiskBadge, CategoryBadge } from '../ui/Badge';

const SEVERITY_BORDER = {
  critical: 'border-l-4 border-l-rose-500 bg-rose-50/20',
  high: 'border-l-4 border-l-orange-500 bg-orange-50/20',
  moderate: 'border-l-4 border-l-amber-500 bg-amber-50/20',
  low: 'border-l-4 border-l-emerald-500 bg-emerald-50/20',
  informational: 'border-l-4 border-l-sky-500 bg-sky-50/20'
};

const SEVERITY_ICONS = {
  critical: AlertOctagon,
  high: AlertTriangle,
  moderate: AlertTriangle,
  low: CheckCircle2,
  informational: Info
};

export function RiskAlert({ alert }) {
  const [expanded, setExpanded] = useState(true);
  const normSeverity = (alert.severity || 'informational').toLowerCase();
  const Icon = SEVERITY_ICONS[normSeverity] || Info;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all ${SEVERITY_BORDER[normSeverity] || ''}`}>
      {/* Alert Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-start gap-3.5">
          <div className={`p-2 rounded-xl shrink-0 ${
            normSeverity === 'critical' ? 'bg-rose-100 text-rose-700' :
            normSeverity === 'high' ? 'bg-orange-100 text-orange-700' :
            normSeverity === 'moderate' ? 'bg-amber-100 text-amber-700' :
            normSeverity === 'low' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
          }`}>
            <Icon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <RiskBadge severity={normSeverity} />
              <CategoryBadge category={alert.category} />
              {alert.confidence && (
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {Math.round(alert.confidence * 100)}% match confidence
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-900 tracking-tight">
              {alert.title}
            </h4>

            {alert.medicationsInvolved?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs font-semibold text-slate-500">Medications Involved:</span>
                {alert.medicationsInvolved.map((med, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    {med}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="text-slate-400 hover:text-slate-600 p-1 shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Clinical Breakdown */}
      {expanded && (
        <div className="px-4 sm:px-6 pb-6 pt-1 border-t border-slate-100 space-y-4 text-sm text-slate-700">
          {/* Explanation & Potential Concern */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>Pharmacological Mechanism</span>
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {alert.explanation}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Clinical Consequence</span>
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {alert.potentialConcern}
              </p>
            </div>
          </div>

          {/* Recommended Clinical Action */}
          <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200">
            <h5 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-700" />
              <span>Recommended Prescriber Consideration</span>
            </h5>
            <p className="text-xs text-teal-950 font-medium leading-relaxed">
              {alert.recommendedClinicalAction}
            </p>
          </div>

          {/* Monitoring Requirements */}
          {alert.monitoring?.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-600" />
                <span>Targeted Clinical Monitoring Protocol</span>
              </h5>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {alert.monitoring.map((m, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Possible Alternatives */}
          {alert.possibleAlternatives?.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/60 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Alternatives for Clinician Consideration
                </h5>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 italic">
                Presented strictly as reference options. Requires individual clinical reconciliation and prescriber discretion.
              </p>
              <div className="space-y-2">
                {alert.possibleAlternatives.map((alt, i) => (
                  <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 text-teal-700">
                        <ArrowRight className="w-3 h-3 text-teal-500" />
                        {alt.name}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-1.5">{alt.reason}</p>
                    {alt.caveats && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                        <span className="font-semibold">Caveat:</span> {alt.caveats}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Limitations */}
          {alert.limitations?.length > 0 && (
            <div className="pt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-600">Clinical Data Limitations:</span>{' '}
                {alert.limitations.join('; ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
