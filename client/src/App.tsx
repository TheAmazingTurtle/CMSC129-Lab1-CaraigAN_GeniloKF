import React from 'react';
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

const RootRedirect = () => {
  const token = localStorage.getItem('game_token');
  return token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
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
