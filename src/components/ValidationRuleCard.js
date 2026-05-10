import React, { useState } from 'react';
import './ValidationRuleCard.css';

export default function ValidationRuleCard({ rule, onToggle, isPending, style }) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = rule.LastModifiedDate
    ? new Date(rule.LastModifiedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div
      className={`rule-card card animate-slide-up ${rule.Active ? 'rule-active' : 'rule-inactive'} ${isPending ? 'rule-pending' : ''}`}
      style={style}
    >
      {isPending && <div className="pending-stripe" title="Unsaved change" />}

      <div className="rule-card-header">
        <div className="rule-name-row">
          <h3 className="rule-name">{rule.ValidationName}</h3>
          <span className={`badge ${rule.Active ? 'badge-active' : 'badge-inactive'}`}>
            <span className="badge-dot" />
            {rule.Active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {rule.Description && (
          <p className="rule-description">{rule.Description}</p>
        )}
      </div>

      <div className="rule-meta">
        <div className="meta-item">
          <span className="meta-label">Error Field</span>
          <span className="meta-value">{rule.ErrorDisplayField || 'General'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Modified</span>
          <span className="meta-value">{formattedDate}</span>
        </div>
        {rule.NamespacePrefix && (
          <div className="meta-item">
            <span className="meta-label">Namespace</span>
            <span className="meta-value tag">{rule.NamespacePrefix}</span>
          </div>
        )}
      </div>

      {/* Error message preview */}
      {rule.ErrorMessage && (
        <div className="error-msg-preview">
          <span className="error-msg-icon">⚠</span>
          <span className="error-msg-text">{rule.ErrorMessage}</span>
        </div>
      )}

      {/* Expandable: Rule ID */}
      <button className="expand-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? '▲ Less' : '▼ Details'}
      </button>

      {expanded && (
        <div className="rule-expanded animate-fade-in">
          <div className="rule-id-row">
            <span className="meta-label">Rule ID</span>
            <code className="rule-id">{rule.Id}</code>
          </div>
          <div className="rule-id-row">
            <span className="meta-label">Entity ID</span>
            <code className="rule-id">{rule.EntityDefinitionId}</code>
          </div>
        </div>
      )}

      <div className="rule-card-footer">
        {isPending && (
          <span className="pending-label">
            <span className="pending-dot-sm2" />
            Unsaved
          </span>
        )}
        <button
          className={`btn btn-sm toggle-btn ${rule.Active ? 'btn-danger' : 'btn-success'}`}
          onClick={onToggle}
        >
          {rule.Active ? '⏸ Deactivate' : '▶ Activate'}
        </button>
      </div>
    </div>
  );
}
