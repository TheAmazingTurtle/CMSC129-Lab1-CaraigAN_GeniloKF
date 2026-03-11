import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';
import { apiRequest } from '../../services/apiClient.ts';

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('game_token');
    if (token) {
      // Hero is already in the realm, send them to the front lines
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      // Store the JWT for future authenticated requests
      localStorage.setItem('game_token', data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Tap Tap Travel</h1>
        <p className="subtitle">Welcome back, Hero.</p>

        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleLogin}>
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
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : 'ENTER WORLD'}
          </button>
        </form>

        <p className="footer-text">
          New to these lands? <Link to="/signup" className="toggle-btn">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
