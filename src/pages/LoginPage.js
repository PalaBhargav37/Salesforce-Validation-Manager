import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import './LoginPage.css';

function CloudIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 32H12C7.6 32 4 28.4 4 24C4 20.1 6.6 16.9 10.2 16.1C10.1 15.4 10 14.7 10 14C10 8.5 14.5 4 20 4C23.4 4 26.4 5.6 28.4 8.1C29.6 7.4 31 7 32.5 7C37.2 7 41 10.8 41 15.5C41 15.9 41 16.3 40.9 16.7C43.8 17.8 46 20.7 46 24C46 28.4 42.4 32 38 32Z" fill="url(#cloudGrad)" opacity="0.9"/>
      <path d="M24 32V44M18 38L24 44L30 38" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="cloudGrad" x1="4" y1="4" x2="46" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00d4ff"/>
          <stop offset="1" stopColor="#0066cc"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  // Check for error in URL
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');

  const handleLogin = () => {
    window.location.href = api.loginUrl();
  };

  return (
    <div className="login-page grid-bg">
      {/* Decorative grid lines */}
      <div className="corner-deco top-left" />
      <div className="corner-deco top-right" />
      <div className="corner-deco bottom-left" />
      <div className="corner-deco bottom-right" />

      <div className="login-container animate-slide-up">
        {/* Header */}
        <div className="login-brand">
          <div className="brand-icon">
            <CloudIcon />
          </div>
          <div>
            <p className="brand-eyebrow">Salesforce Tooling</p>
            <h1 className="brand-name">SF Validation<br />Manager</h1>
          </div>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <div className="divider-line" />
          <span className="divider-text">CONNECT ORG</span>
          <div className="divider-line" />
        </div>

        {/* Description */}
        <p className="login-description">
          Authorize with your Salesforce Developer Org to view, toggle, and deploy 
          <span className="highlight"> Account Validation Rules</span> — directly from this dashboard.
        </p>

        {/* Features */}
        <div className="feature-grid">
          {[
            { icon: '🔍', label: 'Fetch All Rules', desc: 'Tooling API query' },
            { icon: '⚡', label: 'Toggle Active State', desc: 'Live org updates' },
            { icon: '🚀', label: 'Deploy Changes', desc: 'Instant sync' },
            { icon: '🔐', label: 'OAuth 2.0 Auth', desc: 'Secure handshake' },
          ].map(f => (
            <div key={f.label} className="feature-item">
              <span className="feature-icon">{f.icon}</span>
              <div>
                <div className="feature-label">{f.label}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <span>⚠</span> Authentication failed: {error.replace(/_/g, ' ')}. Please try again.
          </div>
        )}

        {/* CTA */}
        <button className="login-btn btn btn-primary btn-lg" onClick={handleLogin}>
          <SalesforceIcon />
          Log In with Salesforce
        </button>

        <p className="login-footer">
          Uses OAuth 2.0 Web Flow · No passwords stored · 
          <a href="https://developer.salesforce.com/signup" target="_blank" rel="noreferrer"> Create a Dev Org</a>
        </p>
      </div>

      {/* Right panel — info */}
      <div className="login-info-panel">
        <div className="info-content animate-fade-in">
          <p className="info-heading">What this does</p>
          <div className="info-steps">
            {[
              { n: '01', title: 'OAuth Authorization', body: 'Redirect to Salesforce, grant access, receive auth code.' },
              { n: '02', title: 'Token Exchange', body: 'Server exchanges auth code for access + refresh tokens via /oauth2/token.' },
              { n: '03', title: 'Tooling API Query', body: 'SELECT from ValidationRule where EntityDefinition = Account.' },
              { n: '04', title: 'Metadata Update', body: 'PATCH ValidationRule.Metadata.active to toggle rules live in org.' },
            ].map(s => (
              <div key={s.n} className="info-step">
                <span className="step-number">{s.n}</span>
                <div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-body">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="sf-version-tag">
            <span className="tag">API v59.0</span>
            <span className="tag">Tooling API</span>
            <span className="tag">OAuth 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesforceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.24 6.085a3.8 3.8 0 0 1 2.685-1.11 3.83 3.83 0 0 1 3.305 1.905 4.725 4.725 0 0 1 1.63-.29 4.755 4.755 0 0 1 4.755 4.755 4.755 4.755 0 0 1-4.755 4.755H6.36A3.36 3.36 0 0 1 3 12.745a3.36 3.36 0 0 1 2.55-3.26 4.24 4.24 0 0 1-.09-.88 4.285 4.285 0 0 1 4.78-4.52z"/>
    </svg>
  );
}
