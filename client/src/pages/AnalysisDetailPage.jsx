import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ArrowLeft,
  ShieldAlert,
  Calendar,
  User,
  Pill,
  Printer,
  Share2
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorBanner } from '../components/ui/Feedback';
import { RiskSummary } from '../components/analysis/RiskSummary';
import { RiskAlert } from '../components/analysis/RiskAlert';
import { AlternativeTabletsCard } from '../components/analysis/AlternativeTabletsCard';

export function AnalysisDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!token || !id) return;
      try {
        setLoading(true);
        setError('');
        const res = await api.getAnalysis(token, id);
        setAnalysis(res.analysis);
      } catch (err) {
        console.error('Error loading analysis:', err);
        setError(err.message || 'Unable to load analysis record.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving archived safety analysis..." size="lg" className="py-20" />;
  }

  if (error || !analysis) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error || 'Analysis record not found.'} />
        <Button variant="secondary" onClick={() => navigate('/history')} icon={ArrowLeft}>
          Back to Analysis History
        </Button>
      </div>
    );
  }

  const patient = analysis.patients || analysis.input_snapshot?.patient || {};
  const existingMeds = analysis.input_snapshot?.existingMedications || [];
  const newMeds = analysis.input_snapshot?.newMedications || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Safety Analysis Record
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record ID: <span className="font-mono text-slate-600">{analysis.id}</span> • Evaluated on {new Date(analysis.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            icon={Printer}
          >
            Print Report
          </Button>
          {patient?.id && (
            <Button
              size="sm"
              onClick={() => navigate(`/patients/${patient.id}`)}
              icon={User}
            >
              Patient Chart
            </Button>
          )}
        </div>
      </div>

      {/* Snapshot Summary of Evaluated Context */}
      <Card>
        <CardContent className="p-5 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1">
              Patient
            </span>
            <p className="text-sm font-bold text-slate-800">{patient.full_name || patient.fullName || 'Unknown'}</p>
            <p className="text-slate-500 capitalize">
              {patient.sex || 'Unknown'} {patient.date_of_birth && `• ${patient.date_of_birth}`}
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1">
              Active Baseline Meds Screened ({existingMeds.length})
            </span>
            <p className="text-slate-600">
              {existingMeds.length > 0 ? existingMeds.join(', ') : 'None documented'}
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1">
              Proposed New Prescriptions ({newMeds.length})
            </span>
            <p className="font-semibold text-teal-800">
              {newMeds.length > 0 ? newMeds.join(', ') : 'None recorded'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Risk Summary Banner */}
      <RiskSummary
        result={analysis.result}
        patientName={patient.full_name || patient.fullName}
        timestamp={analysis.created_at}
      />

      {/* Recommended Alternative Tablets & Safe Formulations */}
      <AlternativeTabletsCard alerts={analysis.result.alerts} />

      {/* List of Alerts */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Safety Findings & Clinical Recommendations ({analysis.result.alerts?.length || 0})
        </h3>

        {analysis.result.alerts?.map((alert, i) => (
          <RiskAlert key={i} alert={alert} />
        ))}
      </div>

      {/* Data Limitations */}
      {analysis.result.dataLimitations?.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">Assessment Boundary:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
              {analysis.result.dataLimitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
