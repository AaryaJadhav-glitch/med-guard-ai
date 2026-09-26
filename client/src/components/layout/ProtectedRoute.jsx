import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui/Feedback';

export function ProtectedRoute({ children }) {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying clinical credentials & email status..." size="lg" />
      </div>
    );
  }

  // 1. Must have an active Supabase session
  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Must have a confirmed email address verified by Supabase Auth
  if (!user.email_confirmed_at) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
