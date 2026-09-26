import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Menu,
  LogOut,
  User,
  Database,
  CheckCircle2,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export function Topbar({ onMenuClick }) {
  const { user, profile, signOut, token } = useAuth();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  async function handleLogout() {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  async function handleSeedDemoData() {
    if (!token) return;
    try {
      setSeeding(true);
      await api.seedDemoData(token);
      setSeedSuccess(true);
      setTimeout(() => {
        setSeedSuccess(false);
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('Demo data seed error:', err);
      alert('Unable to load demo data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Mobile Toggle & Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Clinical Decision Engine</span>
          </div>
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Data Loader Button */}
        <button
          onClick={handleSeedDemoData}
          disabled={seeding || seedSuccess}
          title="Populate clinical demo patients (CKD, AFib, Penicillin allergy cases)"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
        >
          {seedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Demo Loaded</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>{seeding ? 'Loading...' : 'Load Clinical Demo'}</span>
            </>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <Stethoscope className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">
              {profile?.full_name || user?.email?.split('@')[0] || 'Clinician'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none capitalize">
              {profile?.role ? profile.role.replace('_', ' ') : 'Healthcare Professional'}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          title="Sign out of Med-Guard AI"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
