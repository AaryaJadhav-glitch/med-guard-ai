import React, { useEffect, useState, useMemo } from 'react';
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
  Sparkles,
  Pill,
  Search,
  Check,
  Copy,
  Clock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Activity,
  HeartPulse
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/ui/Feedback';

// Clinical reference database for safe tablet alternatives
const REFERENCE_TABLET_ALTERNATIVES = [
  {
    targetDrug: 'Ibuprofen / Naproxen (NSAIDs)',
    conflictType: 'GI Ulceration & Renal Risk',
    alternativeTablet: 'Acetaminophen 500mg Tablet',
    dosageForm: 'Oral Tablet (q4-6h prn)',
    rationale: 'Renal-sparing and does not cause gastric mucosal erosion.',
    caveats: 'Verify absence of acute liver disease; limit daily dose.'
  },
  {
    targetDrug: 'NSAIDs in High Bleeding Risk',
    conflictType: 'Concomitant Anticoagulation',
    alternativeTablet: 'Celecoxib 100mg + Omeprazole 20mg',
    dosageForm: 'Oral Capsule + PPI Tablet',
    rationale: 'Selective COX-2 inhibition with gastroprotection reduces ulceration.',
    caveats: 'Monitor cardiovascular risk; avoid in ischemic heart disease.'
  },
  {
    targetDrug: 'Amoxicillin / Penicillins',
    conflictType: 'Type-1 Beta-Lactam Allergy',
    alternativeTablet: 'Azithromycin 250mg Tablet',
    dosageForm: 'Oral Tablet (Z-Pak protocol)',
    rationale: 'Macrolide antibiotic with zero beta-lactam cross-reactivity.',
    caveats: 'Check baseline QTc interval if co-prescribed with arrhythmogenic agents.'
  },
  {
    targetDrug: 'Amoxicillin / Cephalosporins',
    conflictType: 'Beta-Lactam Anaphylaxis',
    alternativeTablet: 'Doxycycline 100mg Tablet',
    dosageForm: 'Oral Tablet (100mg BID)',
    rationale: 'Tetracycline class providing broad coverage without beta-lactam exposure.',
    caveats: 'Avoid in pregnancy; take with a full glass of water.'
  },
  {
    targetDrug: 'Warfarin / Coumarin',
    conflictType: 'Severe Drug-Drug Interactions',
    alternativeTablet: 'Apixaban 5mg Tablet',
    dosageForm: 'Oral Tablet (5mg BID)',
    rationale: 'DOAC with predictable pharmacokinetics and no routine INR monitoring.',
    caveats: 'Adjust dose in renal impairment, age ≥ 80, or weight ≤ 60kg.'
  },
  {
    targetDrug: 'Lisinopril / ACE-Inhibitors',
    conflictType: 'Bradykinin Dry Cough',
    alternativeTablet: 'Losartan 50mg Tablet',
    dosageForm: 'Oral Tablet (once daily)',
    rationale: 'Angiotensin II Receptor Blocker preserving RAAS-inhibition without cough.',
    caveats: 'Check serum potassium and creatinine within 2 weeks of start.'
  },
  {
    targetDrug: 'Metformin',
    conflictType: 'Renal Clearance Decline (eGFR < 30)',
    alternativeTablet: 'Linagliptin 5mg Tablet',
    dosageForm: 'Oral Tablet (5mg daily)',
    rationale: 'DPP-4 inhibitor excreted through bile, requiring zero renal dose titration.',
    caveats: 'Monitor HbA1c; assess for hypersensitivity symptoms.'
  }
];

export function DashboardPage() {
  const { token, profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Active view: 'analyses' | 'alternatives' | 'patients'
  const [activeTab, setActiveTab] = useState('analyses');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'high_risk' | 'low_risk'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTablet, setCopiedTablet] = useState(null);

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

  function handleCopyTablet(name) {
    navigator.clipboard?.writeText(name);
    setCopiedTablet(name);
    setTimeout(() => setCopiedTablet(null), 2000);
  }

  // Aggregate alternative tablets discovered in recent analyses
  const patientCaseAlternatives = useMemo(() => {
    const list = [];
    const seen = new Set();
    recentAnalyses.forEach((item) => {
      (item.result?.alerts || []).forEach((alert) => {
        (alert.possibleAlternatives || []).forEach((alt) => {
          const key = `${item.id}-${alt.name}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              ...alt,
              patientName: item.patients?.full_name || 'Patient',
              analysisId: item.id,
              conflictTitle: alert.title,
              severity: alert.severity,
              createdAt: item.created_at
            });
          }
        });
      });
    });
    return list;
  }, [recentAnalyses]);

  // Filter analyses based on active filters
  const filteredAnalyses = useMemo(() => {
    return recentAnalyses.filter((item) => {
      if (riskFilter === 'high_risk') {
        if (item.overall_risk !== 'critical' && item.overall_risk !== 'high') return false;
      } else if (riskFilter === 'low_risk') {
        if (item.overall_risk !== 'low' && item.overall_risk !== 'moderate') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ptName = (item.patients?.full_name || '').toLowerCase();
        const summary = (item.summary || '').toLowerCase();
        return ptName.includes(q) || summary.includes(q);
      }
      return true;
    });
  }, [recentAnalyses, riskFilter, searchQuery]);

  // Filter tablet alternatives
  const filteredTablets = useMemo(() => {
    if (!searchQuery.trim()) return REFERENCE_TABLET_ALTERNATIVES;
    const q = searchQuery.toLowerCase();
    return REFERENCE_TABLET_ALTERNATIVES.filter(
      (item) =>
        item.targetDrug.toLowerCase().includes(q) ||
        item.alternativeTablet.toLowerCase().includes(q) ||
        item.conflictType.toLowerCase().includes(q) ||
        item.rationale.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="liquid-glass p-8 rounded-3xl flex flex-col items-center gap-4 text-center max-w-sm">
          <LoadingSpinner size="lg" message="Loading Clinical Glass Interface..." />
          <p className="text-xs text-slate-500">Synchronizing patient safety metrics & drug interaction models</p>
        </div>
      </div>
    );
  }

  const criticalCount = stats?.criticalAlertsCount ?? 0;

  return (
    <div className="relative space-y-6">
      {/* Ambient Liquid Light Orbs (Gives glass surfaces depth and luminous refraction) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-16 right-10 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl" />
        <div className="absolute top-80 left-48 w-80 h-80 bg-sky-400/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* ==============================================================================
            1. LIQUID GLASS HERO BANNER
           ============================================================================== */}
        <div className="liquid-glass-hero rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
          {/* Subtle inner glass light gradient */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Med-Guard Clinical Safety DSS</span>
                <span className="text-teal-200/80">•</span>
                <span className="text-teal-200 capitalize">{profile?.role?.replace('_', ' ') || 'Healthcare Professional'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Good day, {profile?.full_name || 'Doctor'}
              </h1>

              <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-normal">
                All patient medication regimens and prospective prescriptions are continuously monitored against real-time clinical contraindications.
              </p>
            </div>

            {/* Hero Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/analysis/new')}
                className="group relative flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4 text-slate-950 transition-transform group-hover:rotate-90 duration-300" />
                <span>New Safety Check</span>
                <div className="absolute inset-0 rounded-2xl border border-white/40 pointer-events-none" />
              </button>

              <button
                onClick={() => navigate('/patients/new')}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold text-xs backdrop-blur-md shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <UserPlus className="w-4 h-4 text-teal-200" />
                <span>Add Patient</span>
              </button>
            </div>
          </div>
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchDashboardData} />}

        {/* ==============================================================================
            2. LIQUID GLASS METRICS ROW
           ============================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: Patients */}
          <div
            onClick={() => setActiveTab('patients')}
            className="liquid-glass-card rounded-2xl p-4 sm:p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-teal-700 transition-colors">
                Active Patients
              </span>
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-700 border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats?.totalPatients ?? 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Isolated clinical profiles</span>
            </div>
          </div>

          {/* Metric 2: Analyses Evaluated */}
          <div
            onClick={() => setActiveTab('analyses')}
            className="liquid-glass-card rounded-2xl p-4 sm:p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-sky-700 transition-colors">
                Safety Screenings
              </span>
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-700 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats?.totalAnalyses ?? 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>AI clinical interactions</span>
            </div>
          </div>

          {/* Metric 3: Critical Hazards */}
          <div
            onClick={() => {
              setActiveTab('analyses');
              setRiskFilter('high_risk');
            }}
            className={`liquid-glass-card rounded-2xl p-4 sm:p-5 cursor-pointer group ${
              criticalCount > 0 ? 'border-rose-400/50 bg-rose-50/30' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                criticalCount > 0 ? 'text-rose-700' : 'text-slate-500'
              }`}>
                Critical Hazards
              </span>
              <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                criticalCount > 0
                  ? 'bg-rose-500/15 text-rose-700 border-rose-500/30 pulse-critical'
                  : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
              }`}>
                {criticalCount > 0 ? (
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              criticalCount > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {criticalCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              {criticalCount > 0 ? (
                <span className="text-rose-600 font-semibold">Requires attention</span>
              ) : (
                <span className="text-emerald-700 font-medium">Zero pending alerts</span>
              )}
            </div>
          </div>

          {/* Metric 4: Safe Tablet Alternatives */}
          <div
            onClick={() => setActiveTab('alternatives')}
            className="liquid-glass-card rounded-2xl p-4 sm:p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-teal-700 transition-colors">
                Alternative Tablets
              </span>
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-700 border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-800 tracking-tight">
              {patientCaseAlternatives.length > 0 ? patientCaseAlternatives.length : REFERENCE_TABLET_ALTERNATIVES.length}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              <Check className="w-3 h-3 text-teal-600" />
              <span>Safe prescriber tablets</span>
            </div>
          </div>
        </div>

        {/* ==============================================================================
            3. LIQUID GLASS QUICK LAUNCHER & SEARCH
           ============================================================================== */}
        <div className="liquid-glass rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-700 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Instant Safety Check</span>
              <span className="text-[11px] text-slate-500">Quick-screen frequent prescriptions or filter records</span>
            </div>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Common Drugs:
            </span>
            {['Warfarin', 'Amoxicillin', 'Lisinopril', 'Ibuprofen', 'Metformin'].map((drug) => (
              <button
                key={drug}
                onClick={() => {
                  setActiveTab('alternatives');
                  setSearchQuery(drug);
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white/70 hover:bg-teal-50 hover:text-teal-700 border border-slate-200/70 hover:border-teal-300 transition-all text-slate-600"
              >
                {drug}
              </button>
            ))}
          </div>

          {/* Search Input with Liquid Glass Styling */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search evaluations, drugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="liquid-glass-input w-full pl-8 pr-3 py-1.5 text-xs rounded-xl focus:outline-none text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ==============================================================================
            4. STREAMLINED SEGMENTED WORKSPACE
           ============================================================================== */}
        <div className="space-y-4">
          {/* Liquid Glass Segmented Tab Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/40 backdrop-blur-md rounded-2xl border border-white/60">
              <button
                onClick={() => {
                  setActiveTab('analyses');
                  setRiskFilter('all');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'analyses'
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
                <span>Recent Safety Analyses</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                  {recentAnalyses.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('alternatives')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'alternatives'
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                <span>Safe Tablet Alternatives</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-50 text-teal-700 font-semibold">
                  {REFERENCE_TABLET_ALTERNATIVES.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('patients')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'patients'
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>Patient Directory</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                  {recentPatients.length}
                </span>
              </button>
            </div>

            {/* Context Actions per tab */}
            {activeTab === 'analyses' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/70 backdrop-blur-md rounded-xl p-0.5 border border-slate-200/70 text-xs">
                  <button
                    onClick={() => setRiskFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                      riskFilter === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRiskFilter('high_risk')}
                    className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                      riskFilter === 'high_risk' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    High Risk
                  </button>
                  <button
                    onClick={() => setRiskFilter('low_risk')}
                    className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                      riskFilter === 'low_risk' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Low Risk
                  </button>
                </div>

                <Link
                  to="/history"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/60 transition-colors"
                >
                  <span>Full History</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {activeTab === 'alternatives' && (
              <Button
                size="sm"
                onClick={() => navigate('/analysis/new')}
                icon={PlusCircle}
                className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                Screen New Drug
              </Button>
            )}

            {activeTab === 'patients' && (
              <Button
                size="sm"
                onClick={() => navigate('/patients/new')}
                icon={UserPlus}
                className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                Register Patient
              </Button>
            )}
          </div>

          {/* TAB CONTENT: 1. Recent Safety Analyses */}
          {activeTab === 'analyses' && (
            <div className="space-y-3">
              {filteredAnalyses.length === 0 ? (
                <div className="liquid-glass-card rounded-3xl p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">No Safety Screenings Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                    {searchQuery
                      ? 'No evaluations match your search query. Try clearing the search filter.'
                      : 'Screen prospective medications against patient conditions and beta-lactam allergies to evaluate drug-interaction risks.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => navigate('/analysis/new')}
                      icon={PlusCircle}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Start First Analysis
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleLoadDemo}
                      loading={seeding}
                      icon={Database}
                    >
                      Load Sample Patient Cases
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredAnalyses.map((item) => {
                    const altCount = (item.result?.alerts || []).reduce(
                      (acc, a) => acc + (a.possibleAlternatives?.length || 0),
                      0
                    );

                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/analysis/${item.id}`)}
                        className="liquid-glass-card rounded-2xl p-4.5 sm:p-5 cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top: Patient & Risk Badge */}
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                {item.patients?.full_name?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                                  {item.patients?.full_name || 'Patient Case'}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>

                            <RiskBadge severity={item.overall_risk} size="sm" />
                          </div>

                          {/* Summary */}
                          <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
                            {item.summary || 'Clinical safety evaluation completed with full risk profile.'}
                          </p>
                        </div>

                        {/* Card Bottom: Alternative Tablets Available tag & Action */}
                        <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between">
                          {altCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/80">
                              <Pill className="w-3 h-3 text-teal-600" />
                              <span>{altCount} Alternative Tablet{altCount === 1 ? '' : 's'}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Standard Protocol</span>
                          )}

                          <span className="text-xs font-semibold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: 2. Safe Tablet Alternatives */}
          {activeTab === 'alternatives' && (
            <div className="space-y-4">
              <div className="liquid-glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-700">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Safe Tablet Formulary</h3>
                    <p className="text-[11px] text-slate-500">
                      Standard clinical tablet substitutions for contraindicated drug pairings.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-slate-500 bg-white/70 px-2.5 py-1 rounded-xl border border-slate-200">
                  Showing {filteredTablets.length} Tablets
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredTablets.map((item, idx) => (
                  <div
                    key={idx}
                    className="liquid-glass-card rounded-2xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{item.alternativeTablet}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyTablet(item.alternativeTablet)}
                          className="p-1 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-white/80 transition-colors"
                          title="Copy tablet name"
                        >
                          {copiedTablet === item.alternativeTablet ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60 mb-2">
                        Avoids: {item.targetDrug}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                        {item.rationale}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[10px] text-amber-900">
                      <span className="font-bold">Prescriber Note:</span> {item.caveats}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. Patient Directory */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              {recentPatients.length === 0 ? (
                <div className="liquid-glass-card rounded-3xl p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">No Patient Records Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                    Register a patient profile to document known allergies, current chronic medications, and pre-existing medical conditions.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => navigate('/patients/new')}
                      icon={UserPlus}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Add Patient Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleLoadDemo}
                      loading={seeding}
                      icon={Database}
                    >
                      Seed Demo Cases
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {recentPatients.map((pt) => (
                    <div
                      key={pt.id}
                      onClick={() => navigate(`/patients/${pt.id}`)}
                      className="liquid-glass-card rounded-2xl p-4.5 cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                          {pt.full_name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {pt.full_name}
                          </h4>
                          <p className="text-[11px] text-slate-400 capitalize">
                            {pt.sex || 'Unknown'} {pt.date_of_birth && `• ${pt.date_of_birth}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                        <span>Profile</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
