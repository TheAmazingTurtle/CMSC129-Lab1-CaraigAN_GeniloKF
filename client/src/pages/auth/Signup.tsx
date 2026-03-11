import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';
import { apiRequest } from '../../services/apiClient.ts';
import type { AuthResponse } from '../../types/api.ts';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (password !== confirmPassword) {
      return setError('Passwords do not match!');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);

    try {
      const data = await apiRequest<AuthResponse>('/api/auth/signup', {
        method: 'POST',
        body: { email, password },
      });

      // Store token and move to dashboard
      localStorage.setItem('game_token', data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Tap Tap Travel</h1>
        <p className="subtitle">Forge your destiny...</p>

        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="hero@example.com"
            />
          </div>
          
          <div className="input-group">
            <label>Choose Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'FORGING...' : 'CREATE CHARACTER'}
          </button>
        </form>

        <p className="footer-text">
          Already a traveler? <Link to="/login" className="toggle-btn">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
