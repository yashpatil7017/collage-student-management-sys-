import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/students', label: 'Students', icon: '👨‍🎓' },
    { path: '/marks', label: 'Academic Marks', icon: '📝' },
    { path: '/fees', label: 'Fees & Invoicing', icon: '💳' },
    { path: '/documents', label: 'Documents Hub', icon: '📁' },
  ];

  // Helper to dynamically color active theme accent (purple for admin, teal for teacher)
  const activeAccent = isAdmin ? 'var(--primary-admin)' : 'var(--primary-teacher)';

  return (
    <div className="app-wrapper">
      {/* SIDEBAR PANEL */}
      <aside className={`sidebar-container ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-symbol">🎓</div>
          {sidebarOpen && <span className="brand-name">SkyBrisk CMS</span>}
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={isActive ? { borderLeft: `4px solid ${activeAccent}`, backgroundColor: 'rgba(255, 255, 255, 0.03)' } : {}}
              >
                <span className="link-icon">{link.icon}</span>
                {sidebarOpen && <span className="link-label">{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="link-icon">🚪</span>
            {sidebarOpen && <span className="link-label">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTROLLER */}
      <div className="main-content">
        {/* HEADER BAR */}
        <header className="header-nav">
          <button 
            className="hamburger-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            ☰
          </button>

          <div className="header-brand-indicator">
            <span className="header-page-title">
              {navLinks.find((l) => l.path === location.pathname)?.label || 'College Portal'}
            </span>
          </div>

          <div className="header-profile-section">
            <div className="profile-details">
              <span className="profile-name">{user?.fullName || 'User'}</span>
              <span className={`badge ${isAdmin ? 'badge-paid' : 'badge-role'}`}>
                {user?.role}
              </span>
            </div>
            <div className="profile-avatar">
              {(user?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="workspace-container">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Side-inject CSS for Layout-specific micro-styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-container {
          background-color: var(--bg-surface);
          border-right: 1px solid var(--border-color);
          width: 260px;
          display: flex;
          flex-direction: column;
          transition: width var(--transition-normal);
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .sidebar-container.collapsed {
          width: 72px;
        }

        .sidebar-brand {
          padding: 24px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .brand-logo-symbol {
          font-size: 1.8rem;
        }

        .brand-name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.15rem;
          white-space: nowrap;
          background: linear-gradient(135deg, #818cf8 0%, #2dd4bf 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          padding: 20px 10px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-weight: 500;
          transition: var(--transition-fast);
          gap: 16px;
        }

        .sidebar-link:hover {
          color: var(--text-main);
          background-color: rgba(255, 255, 255, 0.02);
        }

        .sidebar-link.active {
          color: var(--text-main);
        }

        .link-icon {
          font-size: 1.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
        }

        .link-label {
          white-space: nowrap;
          font-size: 0.95rem;
        }

        .sidebar-footer {
          padding: 20px 10px;
          border-top: 1px solid var(--border-color);
        }

        .sidebar-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 14px 16px;
          border: none;
          background: none;
          color: var(--danger);
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
          gap: 16px;
          text-align: left;
        }

        .sidebar-logout-btn:hover {
          background-color: var(--danger-bg);
        }

        /* Header Bar Styling */
        .header-nav {
          background-color: var(--bg-surface);
          border-bottom: 1px solid var(--border-color);
          padding: 16px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
        }

        .hamburger-btn {
          background: none;
          border: 1px solid var(--border-color);
          color: var(--text-main);
          font-size: 1.2rem;
          cursor: pointer;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .hamburger-btn:hover {
          background-color: var(--bg-surface-light);
        }

        .header-brand-indicator {
          flex: 1;
          margin-left: 20px;
        }

        .header-page-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 600;
        }

        .header-profile-section {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          text-align: right;
          align-items: flex-end;
        }

        .profile-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .profile-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #818cf8 0%, #2dd4bf 100%);
          color: var(--text-dark);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }

        /* Workspace Grid Container */
        .workspace-container {
          padding: 30px;
          flex: 1;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed;
            left: 0;
            bottom: 0;
            top: 72px;
            transform: translateX(-100%);
          }
          
          .sidebar-container.open {
            transform: translateX(0);
            width: 240px;
          }
          
          .sidebar-container.collapsed {
            transform: translateX(-100%);
          }
        }
      `}} />
    </div>
  );
};

export default DashboardLayout;
