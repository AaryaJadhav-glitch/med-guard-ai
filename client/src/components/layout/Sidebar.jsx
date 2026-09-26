import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Pill,
  ShieldAlert,
  History,
  User,
  Settings,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Medications', path: '/medications', icon: Pill },
  { name: 'New Safety Analysis', path: '/analysis/new', icon: ShieldAlert, highlight: true },
  { name: 'Analysis History', path: '/history', icon: History }
];

const SECONDARY_ITEMS = [
  { name: 'Clinical Profile', path: '/profile', icon: User },
  { name: 'System Settings', path: '/settings', icon: Settings }
];

export function Sidebar({ className = '', onClose }) {
  return (
    <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 ${className}`}>
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40">
        <div className="p-2 bg-gradient-to-tr from-teal-600 to-emerald-500 rounded-xl shadow-md text-white">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            Med-Guard <span className="text-teal-400 text-xs px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-800 font-mono">AI</span>
          </span>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            Clinical Safety DSS
          </span>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-4">
        <NavLink
          to="/analysis/new"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium text-sm shadow-md transition-all group"
        >
          <PlusCircle className="w-4 h-4 text-teal-200 group-hover:rotate-90 transition-transform" />
          <span>Start Safety Analysis</span>
        </NavLink>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Clinical Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-teal-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="pt-6">
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            System
          </p>
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-teal-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Footer in Sidebar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-[11px] text-slate-400 leading-tight">
          <span className="font-semibold text-slate-300 block mb-1">Decision Support Only</span>
          All safety suggestions require verification by a qualified healthcare prescriber.
        </div>
      </div>
    </aside>
  );
}
