import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TEACHER');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !password || !role) {
      return toast.error('Please complete all form fields.');
    }

    if (password.length < 6) {
      return toast.error('Password security key must be at least 6 characters.');
    }

    const toastId = toast.loading('Establishing database credential...');
    const result = await register(fullName, email, password, role);

    if (result.success) {
      toast.success('Registration successful. Secure session initialized!', { id: toastId });
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
          <p className="auth-subtitle">Provision New Staff / Admin Credentials</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name-input">Full Signature Name</label>
            <input
              id="name-input"
              type="text"
              className="form-control"
              placeholder="e.g. Prof. Harshwardhan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Official Email Address</label>
            <input
              id="email-input"
              type="email"
              className="form-control"
              placeholder="e.g. faculty@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role-select">Access Permissions Role</label>
            <select
              id="role-select"
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="TEACHER">TEACHER (Standard Academic Logs)</option>
              <option value="ADMIN">ADMINISTRATOR (Full Master Access)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password-input">Account Password Key</label>
            <input
              id="password-input"
              type="password"
              className="form-control"
              placeholder="Min 6 characters"
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
            {loading ? 'Compiling Credentials...' : 'Register Secure Profile'}
          </button>
        </form>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have college credentials configured?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: '600', textDecoration: 'underline' }}>
            Access Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
