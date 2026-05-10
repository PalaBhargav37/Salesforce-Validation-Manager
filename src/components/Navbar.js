import React from 'react';
import './Navbar.css';

export default function Navbar({ user, onLogout, pendingCount }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="nav-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="nav-title">SF Validation Manager</span>
          <span className="nav-version tag">v1.0</span>
        </div>

        <div className="navbar-right">
          {pendingCount > 0 && (
            <div className="nav-pending-badge">
              <span className="pending-dot-sm" />
              {pendingCount} pending
            </div>
          )}

          {user && (
            <div className="nav-user">
              <div className="nav-user-info">
                <span className="nav-user-name">{user.name}</span>
                <span className="nav-user-org">{user.username}</span>
              </div>
              <div className="nav-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
