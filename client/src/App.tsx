import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/auth/Login.tsx';
import Signup from './pages/auth/Signup.tsx';
import ProtectedRoute from './pages/auth/ProtectedRoute.tsx';

import GameLayout from './pages/game/layout/GameLayout.tsx';
import Dashboard from './pages/game/dashboard/Dashboard.tsx';
import Character from './pages/game/character/Character.tsx';
import Inventory from './pages/game/inventory/Inventory.tsx';
import Shop from './pages/game/shop/Shop.tsx';

import { PlayerProvider } from './contexts/PlayerContext.tsx';
import { EquipmentProvider } from './contexts/EquipmentContext.tsx';
import { ItemProvider } from './contexts/ItemContext.tsx';
import { EnemyProvider } from './contexts/EnemyContext.tsx';
import GameSaveGate from './contexts/GameSaveGate.tsx';
import { getApiBaseUrl } from './config.ts';

const RootRedirect: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'authed'>('checking');

  useEffect(() => {
    const token = localStorage.getItem('game_token');
    if (!token) {
      setStatus('checking');
      return;
    }

    const baseUrl = getApiBaseUrl();

    fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        setStatus(res.ok ? 'authed' : 'checking');
      })
      .catch(() => {
        setStatus('checking');
      });
  }, []);

  if (status === 'checking') return <Navigate to="/login" />;
  return <Navigate to="/dashboard" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <EquipmentProvider>
        <PlayerProvider>
          <ItemProvider>
            <EnemyProvider>
              <GameSaveGate>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/login" element={<Login />} />

                  {/* Private Game Routes */}
                  
                  <Route element={<ProtectedRoute />}>
                    <Route element={<GameLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/character" element={<Character />} />
                      <Route path="/shop" element={<Shop />} />
                    </Route>
                  </Route>
                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
              </GameSaveGate>
            </EnemyProvider>
          </ItemProvider>
        </PlayerProvider>
      </EquipmentProvider>
    </Router>
  );
};

export default App;
