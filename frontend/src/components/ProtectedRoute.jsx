import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  // Show a premium loading indicator while checking sessions
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0d16',
        color: '#f1f5f9',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p style={{ letterSpacing: '0.05em', fontSize: '0.9rem', color: '#94a3b8' }}>INITIALIZING SECURE SESSION...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If role constraints are configured, restrict access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0d16',
        color: '#f1f5f9',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            fontSize: '3rem',
            color: '#ef4444',
            marginBottom: '16px'
          }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', fontFamily: 'Poppins' }}>ACCESS FORBIDDEN</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '0.95rem' }}>
            Your account role (<strong>{user.role}</strong>) does not have authorization to view this resource. 
            Please contact the administrator if you believe this is in error.
          </p>
          <a 
            href="/dashboard" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#1b2336',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
