import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { RiskBadge } from '../ui/Badge';

const OVERALL_RISK_THEMES = {
  critical: {
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-900',
    badge: 'bg-rose-600 text-white',
    icon: AlertOctagon,
    desc: 'Critical medication risks detected. Immediate prescriber reconciliation required before dispensing.'
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-900',
    badge: 'bg-orange-600 text-white',
    icon: AlertTriangle,
    desc: 'High-risk interaction or contraindication identified. Clinical dose adjustment or monitoring required.'
  },
  moderate: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    badge: 'bg-amber-500 text-white',
    icon: AlertTriangle,
    desc: 'Moderate clinical concern. Patient requires targeted observation or baseline laboratory testing.'
  },
  low: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    badge: 'bg-emerald-600 text-white',
    icon: CheckCircle2,
    desc: 'Minor or standard medication advisory. No acute high-grade contraindications detected.'
  },
  informational: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-900',
    badge: 'bg-sky-600 text-white',
    icon: Info,
    desc: 'Informational review complete. Profile aligns with standard prescribing safety parameters.'
  }
};

export function RiskSummary({ result, patientName, timestamp }) {
  const normRisk = (result?.overallRisk || 'informational').toLowerCase();
  const theme = OVERALL_RISK_THEMES[normRisk] || OVERALL_RISK_THEMES.informational;
  const Icon = theme.icon;

  const alerts = result?.alerts || [];
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  const moderateCount = alerts.filter(a => a.severity === 'moderate').length;
  const lowCount = alerts.filter(a => a.severity === 'low').length;

  return (
    <div className={`p-6 rounded-2xl border ${theme.border} ${theme.bg} shadow-sm space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl ${theme.badge} shadow-md`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evaluation Assessment
              </span>
              <RiskBadge severity={normRisk} size="lg" />
            </div>
            <h3 className={`text-xl font-extrabold tracking-tight ${theme.text}`}>
              {normRisk.toUpperCase()} SAFETY ALERT
            </h3>
            {patientName && (
              <p className="text-xs text-slate-600 mt-0.5">
                Evaluation for <span className="font-semibold text-slate-800">{patientName}</span>
                {timestamp && ` • ${new Date(timestamp).toLocaleString()}`}
              </p>
            )}
          </div>
        </div>

        {/* Severity Metrics Bar */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs p-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-center px-2.5 py-1">
            <span className="block text-sm font-bold text-rose-600">{criticalCount}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Critical</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-center px-2.5 py-1">
            <span className="block text-sm font-bold text-orange-600">{highCount}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">High</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-center px-2.5 py-1">
            <span className="block text-sm font-bold text-amber-600">{moderateCount}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Moderate</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-center px-2.5 py-1">
            <span className="block text-sm font-bold text-emerald-600">{lowCount}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Low</span>
          </div>
        </div>
      </div>

      {/* Clinical Narrative Summary */}
      <div className="p-4 bg-white/90 rounded-xl border border-slate-200/90 text-sm text-slate-800 leading-relaxed shadow-2xs">
        <p className="font-medium">{result?.summary || theme.desc}</p>
      </div>

      {/* Mandatory Decision Support Disclaimer Strip */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900">
        <FileCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-tight">
          <span className="font-bold">Clinical Decision Support Advisory:</span> This AI safety evaluation does not replace independent clinical judgment, pharmacist review, or official prescribing monographs. Final prescribing responsibility rests solely with the licensed healthcare provider.
        </p>
      </div>
    </div>
  );
}
