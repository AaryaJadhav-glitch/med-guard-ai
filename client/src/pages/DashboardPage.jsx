import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Users,
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  PlusCircle,
  UserPlus,
  ArrowRight,
  Database,
  Calendar,
  Activity,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/ui/Feedback';

export function DashboardPage() {
  const { token, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  async function fetchDashboardData() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.getDashboardStats(token);
      setStats(data.stats);
      setRecentAnalyses(data.recentAnalyses || []);
      setRecentPatients(data.recentPatients || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to load clinical metrics.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadDemo() {
    try {
      setSeeding(true);
      await api.seedDemoData(token);
      await fetchDashboardData();
    } catch (err) {
      alert('Error seeding demo data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Aggregating clinical safety indicators..." size="lg" className="py-20" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Clinical Safety Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800">
              Live DSS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome, <span className="font-semibold text-slate-700">{profile?.full_name || 'Clinician'}</span>. Monitor real-time medication risks and review safety evaluations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => navigate('/patients/new')}
            icon={UserPlus}
            size="sm"
          >
            Add Patient
          </Button>

          <Button
            onClick={() => navigate('/analysis/new')}
            icon={PlusCircle}
            size="sm"
          >
            New Safety Analysis
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchDashboardData} />}

      {/* Safety Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Patients
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.totalPatients ?? 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Isolated records</p>
            </div>
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Analyses */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Analyses Evaluated
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.totalAnalyses ?? 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">AI-assisted checks</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card className={`hover:shadow-md transition-shadow ${stats?.criticalAlertsCount > 0 ? 'border-rose-300 bg-rose-50/20' : ''}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Critical Hazards
              </p>
              <h3 className="text-2xl font-bold text-rose-800 mt-1">
                {stats?.criticalAlertsCount ?? 0}
              </h3>
              <p className="text-[11px] text-rose-600/80 mt-0.5">Immediate intervention</p>
            </div>
            <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* High Risk Alerts */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                High Risk Alerts
              </p>
              <h3 className="text-2xl font-bold text-orange-700 mt-1">
                {stats?.highRiskAlertsCount ?? 0}
              </h3>
              <p className="text-[11px] text-orange-600/80 mt-0.5">Dose / monitoring action</p>
            </div>
            <div className="p-3 bg-orange-100 text-orange-700 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Analyses & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Safety Evaluations (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Recent Medication Safety Analyses"
              subtitle="Latest AI drug-interaction & allergy screenings performed"
              action={
                <Link
                  to="/history"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="p-0 divide-y divide-slate-100">
              {recentAnalyses.length === 0 ? (
                <div className="p-8 text-center">
                  <EmptyState
                    title="No analyses conducted yet"
                    description="Initiate a safety evaluation to screen a patient's existing medication profile against newly proposed prescriptions."
                    action={
                      <Button
                        size="sm"
                        onClick={() => navigate('/analysis/new')}
                        icon={PlusCircle}
                        className="mt-2"
                      >
                        Start First Analysis
                      </Button>
                    }
                  />
                </div>
              ) : (
                recentAnalyses.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/analysis/${item.id}`)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {item.patients?.full_name || 'Patient'}
                        </span>
                        <RiskBadge severity={item.overall_risk} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {item.summary}
                      </p>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Patients Sidebar (1 Col) */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Recent Patients"
              subtitle="Quick access to active profiles"
              action={
                <Link
                  to="/patients"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  All Patients <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="p-0 divide-y divide-slate-100">
              {recentPatients.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-slate-500 mb-3">No patients created yet.</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleLoadDemo}
                    loading={seeding}
                    icon={Database}
                  >
                    Load Sample Cases
                  </Button>
                </div>
              ) : (
                recentPatients.map((pt) => (
                  <div
                    key={pt.id}
                    onClick={() => navigate(`/patients/${pt.id}`)}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{pt.full_name}</p>
                      <p className="text-xs text-slate-400 capitalize">
                        {pt.sex || 'Unknown sex'} {pt.date_of_birth && `• ${pt.date_of_birth}`}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Info Box */}
          <div className="p-4 bg-gradient-to-br from-teal-900 to-slate-900 text-teal-100 rounded-xl shadow-sm text-xs space-y-2 border border-teal-800">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Conservative Clinical Reasoning</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Med-Guard AI uses strict clinical guidelines to detect drug-drug interactions, beta-lactam allergy cross-reactivities, and organ clearance contraindications before prescribing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
