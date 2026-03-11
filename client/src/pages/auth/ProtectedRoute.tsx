import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getApiBaseUrl } from '../../config.ts';

const ProtectedRoute: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'authed' | 'rejected'>('checking');
  const token = localStorage.getItem('game_token');

  useEffect(() => {
    if (!token) {
      setStatus('rejected');
      return;
    }

    const baseUrl = getApiBaseUrl();

    fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => setStatus(res.ok ? 'authed' : 'rejected'))
      .catch(() => setStatus('rejected'));
  }, [token]);

  if (status === 'checking') return null;
  if (status === 'rejected') return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
