import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout & Route Guards
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Marks from './pages/Marks';
import Fees from './pages/Fees';
import Documents from './pages/Documents';

function App() {
  return (
    <>
      {/* Toast provider configures responsive alert banners globally */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--bg-surface-light)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            boxShadow: 'var(--shadow-lg)'
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'var(--bg-surface)'
            }
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'var(--bg-surface)'
            }
          }
        }} 
      />

      <Routes>
        {/* Public Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Secure Dashboard Shell */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Subpages injected smoothly inside Outlet */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="marks" element={<Marks />} />
          <Route path="fees" element={<Fees />} />
          <Route path="documents" element={<Documents />} />
        </Route>

        {/* Fallback to main secure root */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
