import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading clinical data...', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  }[size] || 'h-8 w-8 border-3';

  return (
    <div className={`flex flex-col items-center justify-center py-10 gap-3 text-slate-500 ${className}`}>
      <div className={`animate-spin rounded-full border-teal-600 border-t-transparent ${sizeClasses}`} />
      {message && <p className="text-xs font-medium text-slate-600 animate-pulse">{message}</p>}
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  description = 'No clinical data is currently recorded for this section.',
  icon: Icon = Inbox,
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}>
      <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorBanner({ title = 'Error', message, onRetry }) {
  if (!message) return null;
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-rose-900">{title}</p>
        <p className="mt-0.5 text-xs text-rose-700">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-rose-800 underline hover:text-rose-900"
        >
          Retry
        </button>
      )}
    </div>
  );
}
