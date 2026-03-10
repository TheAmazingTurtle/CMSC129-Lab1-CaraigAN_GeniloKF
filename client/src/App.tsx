import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/auth/Login.tsx';
import Signup from './pages/auth/Signup.tsx';
import ProtectedRoute from './pages/auth/ProtectedRoute.tsx';

import GameLayout from './pages/game/GameLayout.tsx';
import Dashboard from './pages/game/Dashboard.tsx';
import Character from './pages/game/Character.tsx';
import Inventory from './pages/game/Inventory.tsx';

import { PlayerProvider } from './contexts/PlayerContext.tsx';

const RootRedirect = () => {
  const token = localStorage.getItem('game_token');
  return token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <PlayerProvider>
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
          </Route>
        </Route>
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      </PlayerProvider>
    </Router>
  );
};

export default App;