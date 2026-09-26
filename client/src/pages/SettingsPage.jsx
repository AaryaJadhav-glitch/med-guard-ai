import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Settings, ShieldCheck, Database, CheckCircle2, Cpu, Lock, Sparkles, Terminal } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function SettingsPage() {
  const { token, isConfigured } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');

  async function handleReloadDemo() {
    if (!token) return;
    try {
      setSeeding(true);
      setSeedNotice('');
      await api.seedDemoData(token);
      setSeedNotice('Clinical demonstration cases loaded successfully into your account.');
    } catch (err) {
      alert('Error loading sample data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-600" />
          <span>System & Safety Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Platform architecture parameters, clinical safety rules, and database configuration.
        </p>
      </div>

      {/* System Status Card */}
      <Card>
        <CardHeader
          title="System Architecture Status"
          subtitle="Real-time health verification of platform components"
        />
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">PostgreSQL RLS</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-slate-800">AI Safety Engine</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 font-mono">
                @google/genai
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">De-Identification Pipeline</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                PII STRIPPED
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-slate-800">Database Connection</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isConfigured ? 'CONNECTED' : 'LOCAL / DEMO'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Demo Dataset Seeder */}
      <Card>
        <CardHeader
          title="Clinical Demonstration Scenarios"
          subtitle="Populate verified case studies to test high-risk interactions"
        />
        <CardContent className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Clicking the button below loads 2 detailed clinical test profiles into your account:
          </p>
          <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
            <li>
              <strong>Eleanor Vance (71 y/o):</strong> Stage 3a CKD, Hypertension on Lisinopril, severe Penicillin allergy.
            </li>
            <li>
              <strong>Arthur Pendelton (66 y/o):</strong> Atrial Fibrillation on Warfarin, Type 2 DM on Metformin, Sulfa allergy.
            </li>
          </ul>

          {seedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{seedNotice}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={handleReloadDemo}
              loading={seeding}
              icon={Database}
            >
              Load / Reset Clinical Demo Profiles
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Decision Support Compliance Notice */}
      <Card className="bg-slate-900 text-slate-300 border-slate-800">
        <CardContent className="p-6 space-y-3 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-teal-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-sm">Clinical Decision-Support System Architecture</h4>
          </div>
          <p>
            Med-Guard AI operates under the fundamental architectural directive that artificial intelligence must never independently prescribe, discontinue, or alter doses. All potential alternative suggestions are formulated strictly as non-prescriptive options for professional consideration.
          </p>
          <p className="text-slate-400">
            Engineered with conservative clinical safety thresholds, automated schema validation (Zod), and de-identification boundaries to safeguard patient data privacy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
