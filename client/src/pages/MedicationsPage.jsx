import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Pill, Search, User, ArrowRight, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';

export function MedicationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await api.getPatients(token);
        // Load full medication lists for each patient
        const pts = res.patients || [];
        const fullPatients = await Promise.all(
          pts.map(async (p) => {
            try {
              const detail = await api.getPatient(token, p.id);
              return detail.patient;
            } catch {
              return p;
            }
          })
        );
        setPatients(fullPatients);
      } catch (err) {
        console.error('Error loading medications list:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  // Flatten all medications with patient references
  const allMeds = [];
  patients.forEach((pt) => {
    (pt.medications || []).forEach((m) => {
      allMeds.push({ ...m, patient: pt });
    });
  });

  const filteredMeds = allMeds.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(search.toLowerCase())) ||
      (m.patient.full_name && m.patient.full_name.toLowerCase().includes(search.toLowerCase()));

    if (filterActive && !m.active) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-600" />
            <span>Medication Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global view of all active and historical prescriptions currently managed across patients.
          </p>
        </div>

        <Button
          onClick={() => navigate('/analysis/new')}
          icon={PlusCircle}
          size="sm"
        >
          Screen New Prescriptions
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by drug name, generic name, or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterActive(!filterActive)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              filterActive
                ? 'bg-teal-50 border-teal-300 text-teal-800'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            {filterActive ? '● Showing Active Only' : 'Showing All (Active & Inactive)'}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Scanning patient medication profiles..." size="lg" className="py-20" />
      ) : filteredMeds.length === 0 ? (
        <EmptyState
          title="No medications found"
          description="Record existing medications on any patient's chart to build their pharmacotherapy profile."
          action={
            <Button size="sm" onClick={() => navigate('/patients')} icon={User}>
              Go to Patient Roster
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeds.map((med) => (
            <Card key={med.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {med.name}
                    </h3>
                    {med.generic_name && (
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        {med.generic_name}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                    med.active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {med.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Strength & Dose:</span>
                    <span className="font-semibold text-slate-800">{med.strength || med.dose || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency / Route:</span>
                    <span className="font-medium text-slate-700">{med.frequency || 'N/A'} • {med.route || 'Oral'}</span>
                  </div>
                  {med.prescribing_provider && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prescriber:</span>
                      <span className="font-medium text-slate-700">{med.prescribing_provider}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/patients/${med.patient.id}`)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <span>Patient: {med.patient.full_name}</span>
                    <ArrowRight className="w-3 h-3 text-teal-600" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
