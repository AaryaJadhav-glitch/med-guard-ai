import React from 'react';

export function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  required = false,
  ...props
}) {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
          error ? 'border-rose-400 text-rose-900 focus:ring-rose-500' : 'border-slate-300 text-slate-800'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  options = [],
  id,
  className = '',
  required = false,
  children,
  ...props
}) {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
          error ? 'border-rose-400 text-rose-900' : 'border-slate-300 text-slate-800'
        } ${className}`}
        {...props}
      >
        {children || options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  id,
  className = '',
  rows = 3,
  required = false,
  ...props
}) {
  const areaId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
          error ? 'border-rose-400 text-rose-900 focus:ring-rose-500' : 'border-slate-300 text-slate-800'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}

export function Checkbox({
  label,
  description,
  id,
  className = '',
  ...props
}) {
  const checkId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="relative flex items-start gap-3">
      <div className="flex h-5 items-center">
        <input
          id={checkId}
          type="checkbox"
          className={`h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer ${className}`}
          {...props}
        />
      </div>
      <div className="text-sm">
        <label htmlFor={checkId} className="font-medium text-slate-800 cursor-pointer select-none">
          {label}
        </label>
        {description && <p className="text-xs text-slate-500 select-none">{description}</p>}
      </div>
    </div>
  );
}
