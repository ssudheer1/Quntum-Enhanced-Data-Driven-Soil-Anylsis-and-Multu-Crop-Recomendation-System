import { useState, useEffect } from 'react';
import './App.css';
import { LanguageProvider, useLanguage } from './i18n/i18n';
import { isAuthenticated, logoutUser, getUser, getUserRole } from './services/authService';
import { predictCrop, getModelComparison, healthCheck } from './services/api';

import Header from './components/Header';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import InputForm from './components/InputForm';
import ResultsDashboard from './components/ResultsDashboard';
import WeatherCard from './components/WeatherCard';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const { t } = useLanguage();
  const [page, setPage] = useState('landing'); // 'landing' | 'auth' | 'farmer' | 'admin'
  const [activeTab, setActiveTab] = useState('analyze');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);

  // Check if already authenticated and route by role
  useEffect(() => {
    if (isAuthenticated()) {
      const role = getUserRole();
      setPage(role === 'admin' ? 'admin' : 'farmer');
    }
  }, []);

  // Health check
  useEffect(() => {
    healthCheck()
      .then(data => setApiStatus(data))
      .catch(() => setApiStatus({ status: 'offline' }));
  }, []);

  function handleAuthSuccess(data) {
    const role = data.user?.role || 'farmer';
    setPage(role === 'admin' ? 'admin' : 'farmer');
  }

  function handleLogout() {
    logoutUser();
    setResults(null);
    setActiveTab('analyze');
    setPage('landing');
  }

  async function handlePredict(inputData) {
    setLoading(true);
    setError('');
    try {
      const response = await predictCrop(inputData);
      setResults(response);
      setActiveTab('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Landing Page
  if (page === 'landing') {
    return (
      <div className="app">
        <LandingPage onGetStarted={() => setPage('auth')} />
      </div>
    );
  }

  // Auth Page
  if (page === 'auth') {
    return (
      <div className="app">
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // ── ADMIN DASHBOARD ──
  if (page === 'admin') {
    const user = getUser();
    return (
      <div className="app admin-app">
        <header className="admin-header">
          <div className="admin-header-left">
            <div className="admin-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#1e293b"/>
                <path d="M16 6C16 6 20 12 20 18C20 22 18 26 16 26C14 26 12 22 12 18C12 12 16 6 16 6Z" fill="#22d3ee" opacity="0.9"/>
                <path d="M16 14C12 10 8 12 8 16C8 18 10 19 12 18C14 17 15 15 16 14Z" fill="#22d3ee" opacity="0.7"/>
                <path d="M16 14C20 10 24 12 24 16C24 18 22 19 20 18C18 17 17 15 16 14Z" fill="#22d3ee" opacity="0.7"/>
              </svg>
            </div>
            <div>
              <h1>QuantumSoil Admin</h1>
              <p>System Control Panel</p>
            </div>
          </div>
          <div className="admin-header-right">
            <span className="admin-badge">🛡️ Admin: {user?.first_name || 'Admin'}</span>
            <button className="btn-admin-logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="admin-main">
          <AdminDashboard />
        </main>

        <footer className="footer admin-footer">
          <p>QuantumSoil Admin Dashboard — Quantum-Enhanced Soil Analysis System</p>
        </footer>
      </div>
    );
  }

  // ── FARMER DASHBOARD ──
  const TABS = [
    { key: 'analyze', label: '🔬 Analyze Soil' },
    { key: 'results', label: '📊 Results' },
    { key: 'weather', label: '🌤️ Weather' },
  ];

  return (
    <div className="app farmer-app">
      <Header onLogout={handleLogout} />

      <nav className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="error-banner animate-fade-in-up">
          <span>⚠️</span> {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <main className="main-content">
        {activeTab === 'analyze' && (
          <div className="analyze-layout">
            <InputForm onSubmit={handlePredict} loading={loading} />
          </div>
        )}

        {activeTab === 'results' && (
          results ? (
            <ResultsDashboard results={results} />
          ) : (
            <div className="glass-card empty-state animate-fade-in-up">
              <span className="empty-icon">🔬</span>
              <h3>{t('analyzeSoil')}</h3>
              <p>Submit soil parameters to see results here.</p>
              <button className="btn-primary" onClick={() => setActiveTab('analyze')}>
                Go to Analyze
              </button>
            </div>
          )
        )}

        {activeTab === 'weather' && (
          <div className="weather-full">
            <WeatherCard />
          </div>
        )}
      </main>

      <footer className="footer">
        <p>{t('footerText')}</p>
        <p className="footer-sub">{t('footerSub')}</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
