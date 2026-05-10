import React from 'react';
import './StatsBar.css';

export default function StatsBar({ total, active, inactive, pending }) {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Total Rules</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value stat-active">{active}</span>
        <span className="stat-label">Active</span>
        <div className="stat-bar-fill">
          <div className="stat-bar-inner active" style={{ width: total ? `${(active/total)*100}%` : '0%' }} />
        </div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value stat-inactive">{inactive}</span>
        <span className="stat-label">Inactive</span>
        <div className="stat-bar-fill">
          <div className="stat-bar-inner inactive" style={{ width: total ? `${(inactive/total)*100}%` : '0%' }} />
        </div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className={`stat-value ${pending > 0 ? 'stat-pending' : ''}`}>{pending}</span>
        <span className="stat-label">Pending Changes</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item stat-org">
        <div className="org-dot" />
        <div>
          <span className="stat-label">Object</span>
          <span className="stat-obj-name">Account</span>
        </div>
      </div>
    </div>
  );
}
