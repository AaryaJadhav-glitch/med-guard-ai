import React, { useState } from 'react';
import { Pill, Sparkles, Check, Copy, ShieldCheck, AlertCircle, ArrowRight, Stethoscope } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';

export function AlternativeTabletsCard({ alerts = [], title = "Recommended Alternative Tablets & Medications", subtitle = "Safer tablet formulations identified by Med - Guard AI to prevent clinical contraindications or interactions." }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Extract all possible alternatives from alerts and associate them with the alert title/context
  const allAlternatives = [];
  const seenNames = new Set();

  (alerts || []).forEach((alert) => {
    (alert.possibleAlternatives || []).forEach((alt) => {
      const normalized = (alt.name || '').toLowerCase().trim();
      if (!seenNames.has(normalized)) {
        seenNames.add(normalized);
        allAlternatives.push({
          ...alt,
          forAlertTitle: alert.title,
          category: alert.category,
          severity: alert.severity,
          medicationsInvolved: alert.medicationsInvolved || []
        });
      }
    });
  });

  function handleCopy(name, idx) {
    navigator.clipboard?.writeText(name);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  if (allAlternatives.length === 0) {
    return (
      <Card className="border-teal-100 bg-gradient-to-br from-teal-50/40 via-white to-slate-50">
        <CardContent className="p-5 flex items-center gap-3.5">
          <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Alternative Tablets Required</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              No conflicting medication interactions or severe allergies were detected requiring therapy replacement.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-teal-200/80 shadow-md bg-gradient-to-br from-white via-teal-50/20 to-slate-50/50 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl text-white shadow-md">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>{title}</span>
                <Sparkles className="w-4 h-4 text-teal-400" />
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                {allAlternatives.length} Option{allAlternatives.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-teal-200/80 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {allAlternatives.map((alt, idx) => (
            <div
              key={idx}
              className="p-4 bg-white rounded-xl border border-teal-100 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Tablet Name & Copy Action */}
                <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                      <Pill className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-slate-900 text-sm tracking-tight">
                      {alt.name}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(alt.name, idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors flex items-center gap-1 text-[11px]"
                    title="Copy tablet name"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Replacing / Conflict Context */}
                {alt.forAlertTitle && (
                  <div className="text-[11px] font-medium text-slate-500 mb-2 flex items-center gap-1">
                    <span className="text-teal-800 font-semibold">Avoids Hazard:</span>
                    <span className="truncate max-w-[280px] text-slate-600" title={alt.forAlertTitle}>
                      {alt.forAlertTitle}
                    </span>
                  </div>
                )}

                {/* Pharmacological Rationale */}
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {alt.reason}
                </p>
              </div>

              {/* Caveats / Prescriber Guidance */}
              {alt.caveats && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong className="font-semibold">Prescriber Caveat:</strong> {alt.caveats}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Disclaimer Footer */}
        <p className="text-[11px] text-slate-400 text-center pt-2">
          * Alternative tablets are generated as clinical decision-support reference options. Formal drug reconciliation and patient assessment required prior to prescribing.
        </p>
      </CardContent>
    </Card>
  );
}
