import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import ValidationRuleCard from '../components/ValidationRuleCard';
import StatsBar from '../components/StatsBar';
import Navbar from '../components/Navbar';
import './Dashboard.css';

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [rules, setRules] = useState([]);
  const [pendingChanges, setPendingChanges] = useState({}); // { id: active }
  const [fetching, setFetching] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [filter, setFilter] = useState('all'); // all | active | inactive
  const [search, setSearch] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  const fetchRules = useCallback(async () => {
    setFetching(true);
    try {
      const data = await api.getValidationRules();
      setRules(data.rules);
      setPendingChanges({});
      setHasFetched(true);
      toast.success(`Fetched ${data.totalSize} validation rules`);
    } catch (err) {
      toast.error('Failed to fetch rules: ' + err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  const handleToggle = (id, currentActive) => {
    const newActive = !currentActive;
    // Update local state immediately for UI feedback
    setRules(prev => prev.map(r => r.Id === id ? { ...r, Active: newActive } : r));
    // Track pending
    setPendingChanges(prev => ({ ...prev, [id]: newActive }));
  };

  const handleActivateAll = () => {
    const changes = {};
    rules.forEach(r => { changes[r.Id] = true; });
    setRules(prev => prev.map(r => ({ ...r, Active: true })));
    setPendingChanges(changes);
    toast('All rules marked as active — click Deploy to save', { icon: '⚡' });
  };

  const handleDeactivateAll = () => {
    const changes = {};
    rules.forEach(r => { changes[r.Id] = false; });
    setRules(prev => prev.map(r => ({ ...r, Active: false })));
    setPendingChanges(changes);
    toast('All rules marked as inactive — click Deploy to save', { icon: '⚡' });
  };

  const handleDeploy = async () => {
    const pendingEntries = Object.entries(pendingChanges);
    if (pendingEntries.length === 0) {
      toast('No pending changes to deploy', { icon: 'ℹ️' });
      return;
    }

    setDeploying(true);
    const toastId = toast.loading(`Deploying ${pendingEntries.length} change(s) to Salesforce...`);
    try {
      const rulesToDeploy = pendingEntries.map(([id, active]) => ({ id, active }));
      const result = await api.deploy({ rules: rulesToDeploy });

      if (result.success) {
        toast.success(result.message, { id: toastId });
        setPendingChanges({});
      } else {
        toast.error(result.message, { id: toastId });
      }
    } catch (err) {
      toast.error('Deploy failed: ' + err.message, { id: toastId });
    } finally {
      setDeploying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Filtered rules
  const filteredRules = rules.filter(r => {
    const matchesFilter = filter === 'all' || (filter === 'active' && r.Active) || (filter === 'inactive' && !r.Active);
    const matchesSearch = !search || r.ValidationName?.toLowerCase().includes(search.toLowerCase()) ||
      r.Description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = Object.keys(pendingChanges).length;
  const activeCount = rules.filter(r => r.Active).length;
  const inactiveCount = rules.filter(r => !r.Active).length;

  if (authLoading) return <div className="loading-screen"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div className="dashboard grid-bg">
      <Navbar user={user} onLogout={handleLogout} pendingCount={pendingCount} />

      <main className="dashboard-main">
        {/* Stats */}
        <StatsBar total={rules.length} active={activeCount} inactive={inactiveCount} pending={pendingCount} />

        {/* Action bar */}
        <div className="action-bar">
          <div className="action-bar-left">
            <button className="btn btn-primary" onClick={fetchRules} disabled={fetching}>
              {fetching ? <><span className="spinner" /> Fetching...</> : '⚡ Fetch Validation Rules'}
            </button>

            {hasFetched && (
              <>
                <button className="btn btn-success btn-sm" onClick={handleActivateAll} disabled={rules.length === 0}>
                  ✓ Activate All
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDeactivateAll} disabled={rules.length === 0}>
                  ✕ Deactivate All
                </button>
              </>
            )}
          </div>

          <div className="action-bar-right">
            {pendingCount > 0 && (
              <div className="pending-indicator">
                <span className="pending-dot" />
                {pendingCount} unsaved change{pendingCount > 1 ? 's' : ''}
              </div>
            )}
            <button
              className="btn btn-outline deploy-btn"
              onClick={handleDeploy}
              disabled={deploying || pendingCount === 0}
            >
              {deploying ? <><span className="spinner" /> Deploying...</> : `🚀 Deploy to Org${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
            </button>
          </div>
        </div>

        {/* Filters */}
        {hasFetched && (
          <div className="filter-bar animate-fade-in">
            <div className="filter-tabs">
              {['all', 'active', 'inactive'].map(f => (
                <button
                  key={f}
                  className={`filter-tab ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="filter-count">
                    {f === 'all' ? rules.length : f === 'active' ? activeCount : inactiveCount}
                  </span>
                </button>
              ))}
            </div>
            <input
              className="search-input"
              placeholder="Search rules..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Content */}
        <div className="rules-section">
          {!hasFetched ? (
            <div className="empty-state">
              <div className="empty-icon">⚡</div>
              <h3>Ready to Connect</h3>
              <p>Click <strong>Fetch Validation Rules</strong> to load all Account validation rules from your Salesforce org.</p>
              <div className="empty-tags">
                <span className="tag">Tooling API</span>
                <span className="tag">Account Object</span>
                <span className="tag">ValidationRule SObject</span>
              </div>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No rules found</h3>
              <p>No validation rules match your current filter.</p>
            </div>
          ) : (
            <div className="rules-grid">
              {filteredRules.map((rule, i) => (
                <ValidationRuleCard
                  key={rule.Id}
                  rule={rule}
                  isPending={rule.Id in pendingChanges}
                  onToggle={() => handleToggle(rule.Id, rule.Active)}
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
