import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Calendar,
  User,
  PlusCircle
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { RiskBadge } from '../components/ui/Badge';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/ui/Feedback';

export function HistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [riskFilter, setRiskFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, [token, riskFilter]);

  async function fetchAnalyses() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.getAnalyses(token, { risk: riskFilter });
      setAnalyses(data.analyses || []);
    } catch (err) {
      console.error('Error fetching analysis history:', err);
      setError(err.message || 'Unable to load analysis history.');
    } finally {
      setLoading(false);
    }
  }

  const filteredAnalyses = analyses.filter((a) => {
    if (!search.trim()) return true;
    const ptName = a.patients?.full_name?.toLowerCase() || '';
    const summary = a.summary?.toLowerCase() || '';
    const query = search.toLowerCase();
    return ptName.includes(query) || summary.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-teal-600" />
            <span>Safety Analysis History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail of all clinical medication safety evaluations performed under your account.
          </p>
        </div>

        <Button
          onClick={() => navigate('/analysis/new')}
          icon={PlusCircle}
          size="sm"
        >
          New Analysis
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchAnalyses} />}

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name or summary findings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical Risk Only</option>
            <option value="high">High Risk Only</option>
            <option value="moderate">Moderate Risk Only</option>
            <option value="low">Low Risk Only</option>
            <option value="informational">Informational Only</option>
          </select>
        </div>
      </div>

      {/* List of Analyses */}
      {loading ? (
        <LoadingSpinner message="Loading historical analyses..." size="lg" className="py-20" />
      ) : filteredAnalyses.length === 0 ? (
        <EmptyState
          title="No safety analyses found"
          description={riskFilter ? `No analyses matched the "${riskFilter}" risk filter.` : 'No medication safety evaluations have been logged yet.'}
          action={
            <Button size="sm" onClick={() => navigate('/analysis/new')} icon={PlusCircle}>
              Run First Analysis
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredAnalyses.map((item) => {
            const alertCount = item.result?.alerts?.length ?? 0;
            const newMedsCount = item.input_snapshot?.newMedications?.length ?? 0;

            return (
              <Card
                key={item.id}
                onClick={() => navigate(`/analysis/${item.id}`)}
                className="hover:border-teal-500 hover:shadow-md cursor-pointer transition-all"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {item.patients?.full_name || 'Patient Record'}
                      </span>
                      <RiskBadge severity={item.overall_risk} size="sm" />
                      <span className="text-xs text-slate-400">
                        • {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span>Prescriptions Evaluated: <strong className="text-slate-700">{newMedsCount}</strong></span>
                      <span>•</span>
                      <span>Advisory Alerts: <strong className="text-slate-700">{alertCount}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-semibold text-teal-600 flex items-center gap-1">
                      Review Findings <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
