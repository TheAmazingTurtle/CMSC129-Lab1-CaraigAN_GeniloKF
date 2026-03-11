import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { apiRequest } from '../../services/apiClient.ts';
import type { MeResponse } from '../../types/api.ts';

const ProtectedRoute: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'authed' | 'rejected'>('checking');
  const token = localStorage.getItem('game_token');

  useEffect(() => {
    if (!token) {
      setStatus('rejected');
      return;
    }

    apiRequest<MeResponse>('/api/auth/me', { token, retry: 1 })
      .then(() => setStatus('authed'))
      .catch(() => setStatus('rejected'));
  }, [token]);

  if (status === 'checking') return null;
  if (status === 'rejected') return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
