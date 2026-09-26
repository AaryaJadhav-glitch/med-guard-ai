import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Users,
  Search,
  UserPlus,
  ArrowRight,
  Pill,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Database
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/ui/Feedback';

export function PatientsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [token]);

  async function fetchPatients(query = '') {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.getPatients(token, query);
      setPatients(data.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.message || 'Unable to retrieve patient roster.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchPatients(search);
  }

  async function handleSeed() {
    try {
      setSeeding(true);
      await api.seedDemoData(token);
      await fetchPatients();
    } catch (err) {
      alert('Error loading sample patients: ' + err.message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Patient Roster</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage electronic health records, documented allergies, and active medication profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {patients.length === 0 && (
            <Button
              variant="secondary"
              onClick={handleSeed}
              loading={seeding}
              icon={Database}
              size="sm"
            >
              Load Demo Cases
            </Button>
          )}
          <Button
            onClick={() => navigate('/patients/new')}
            icon={UserPlus}
            size="sm"
          >
            Add New Patient
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchPatients(search)} />}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient by full name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <Button type="submit" variant="secondary" size="md">
          Search
        </Button>
      </form>

      {/* Patient Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Loading patient profiles..." size="lg" className="py-20" />
      ) : patients.length === 0 ? (
        <EmptyState
          title="No patients match your search"
          description="Add a new patient to your roster or load standard clinical demonstration scenarios."
          action={
            <div className="flex gap-2 justify-center">
              <Button size="sm" onClick={() => navigate('/patients/new')} icon={UserPlus}>
                Create Patient
              </Button>
              <Button size="sm" variant="secondary" onClick={handleSeed} loading={seeding} icon={Database}>
                Load Demo Cases
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((pt) => {
            const allergyCount = pt.allergies?.[0]?.count ?? 0;
            const conditionCount = pt.medical_conditions?.[0]?.count ?? 0;
            const medCount = pt.medications?.[0]?.count ?? 0;

            return (
              <Card
                key={pt.id}
                onClick={() => navigate(`/patients/${pt.id}`)}
                className="hover:border-teal-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {pt.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">
                        {pt.sex || 'Unknown'} {pt.date_of_birth && `• DOB: ${pt.date_of_birth}`}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {pt.full_name.charAt(0)}
                    </div>
                  </div>

                  {pt.medical_notes && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{pt.medical_notes}"
                    </p>
                  )}

                  {/* Profile indicators */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <span className="block font-bold text-slate-800">{medCount}</span>
                      <span className="text-[10px] text-slate-500 uppercase">Meds</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <span className={`block font-bold ${allergyCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {allergyCount}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">Allergies</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <span className="block font-bold text-slate-800">{conditionCount}</span>
                      <span className="text-[10px] text-slate-500 uppercase">Conditions</span>
                    </div>
                  </div>
                </CardContent>

                <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                  <span>Open Clinical Record</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
