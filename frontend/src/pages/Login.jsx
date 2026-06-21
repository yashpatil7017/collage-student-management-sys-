import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.error('Please input both email and password.');
    }

    const toastId = toast.loading('Authenticating user...');
    const result = await login(email, password);

    if (result.success) {
      toast.success(result.message, { id: toastId });
      navigate('/dashboard');
    } else {
      toast.error(result.message, { id: toastId });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">SkyBrisk College</div>
          <p className="auth-subtitle">Student Management System Core Terminal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <input
              id="email-input"
              type="email"
              className="form-control"
              placeholder="e.g. admin@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password-input">Security Password</label>
            <input
              id="password-input"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={loading}
          >
            {loading ? 'Decrypting Session...' : 'Log In Securely'}
          </button>
        </form>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Need to configure a new workspace user?{' '}
          <Link to="/register" style={{ color: '#818cf8', fontWeight: '600', textDecoration: 'underline' }}>
            Register Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
