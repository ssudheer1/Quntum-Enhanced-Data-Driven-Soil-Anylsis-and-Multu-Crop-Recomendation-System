import { useState, useEffect } from 'react';
import './App.css';
import { LanguageProvider, useLanguage } from './i18n/i18n';
import { isAuthenticated, logoutUser, getUser, getUserRole } from './services/authService';
import { predictCrop, getModelComparison, healthCheck, predictYield, getWeather, predictSrikakulam } from './services/api';

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
  const [weatherData, setWeatherData] = useState(null);
  const [yieldResult, setYieldResult] = useState(null);
  const [yieldLoading, setYieldLoading] = useState(false);
  const [srikakulamResult, setSrikakulamResult] = useState(null);
  const [srikakulamLoading, setSrikakulamLoading] = useState(false);

  // Check if already authenticated and route by role
  useEffect(() => {
    if (isAuthenticated()) {
      const role = getUserRole();
      setPage(role === 'admin' ? 'admin' : 'farmer');
    }
  }, []);

  // Health check + weather fetch
  useEffect(() => {
    healthCheck()
      .then(data => setApiStatus(data))
      .catch(() => setApiStatus({ status: 'offline' }));
    // Fetch weather for auto-fill
    getWeather(18.30, 83.90)
      .then(data => setWeatherData(data))
      .catch(() => {});
  }, []);

  function handleAuthSuccess(data) {
    const role = data.user?.role || 'farmer';
    setPage(role === 'admin' ? 'admin' : 'farmer');
  }

  function handleLogout() {
    logoutUser();
    setResults(null);
    setYieldResult(null);
    setActiveTab('analyze');
    setPage('landing');
  }

  async function handlePredict(inputData) {
    setLoading(true);
    setError('');
    try {
      // Auto-fill weather if available
      if (weatherData) {
        if (!inputData.temperature || inputData.temperature === 20.88) inputData.temperature = weatherData.temperature;
        if (!inputData.humidity || inputData.humidity === 82.0) inputData.humidity = weatherData.humidity;
        if (!inputData.rainfall || inputData.rainfall === 202.94) inputData.rainfall = weatherData.rainfall;
      }
      const response = await predictCrop(inputData);
      setResults(response);
      setActiveTab('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleYieldPredict(inputData) {
    setYieldLoading(true);
    setError('');
    try {
      const response = await predictYield(inputData);
      setYieldResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setYieldLoading(false);
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
    { key: 'yield', label: '🌾 Yield Prediction' },
    { key: 'srikakulam', label: '🏔️ Srikakulam' },
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
            <InputForm onSubmit={handlePredict} loading={loading} weatherData={weatherData} />
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

        {activeTab === 'yield' && (
          <YieldPredictionForm
            onSubmit={handleYieldPredict}
            loading={yieldLoading}
            result={yieldResult}
            weatherData={weatherData}
          />
        )}

        {activeTab === 'srikakulam' && (
          <SrikakulamFarmerForm
            onSubmit={async (data) => {
              setSrikakulamLoading(true);
              try {
                const res = await predictSrikakulam(data);
                setSrikakulamResult(res);
              } catch (e) { setError(e.message); }
              setSrikakulamLoading(false);
            }}
            loading={srikakulamLoading}
            result={srikakulamResult}
          />
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

/* ── YIELD PREDICTION FORM (Real crop_yield.csv dataset) ── */
function YieldPredictionForm({ onSubmit, loading, result, weatherData }) {
  const [values, setValues] = useState({
    crop: 'Rice', state: 'Andhra Pradesh', season: 'Kharif', year: 2020,
    area: 1000, production: 5000, fertilizer: 50000, pesticide: 500,
    N: 78, P: 45, K: 22, pH: 6.8,
    avg_temp_c: weatherData?.temperature || 28,
    total_rainfall_mm: weatherData?.rainfall || 1200,
    avg_humidity_percent: weatherData?.humidity || 70,
  });

  function handleChange(key, val) {
    setValues(prev => ({ ...prev, [key]: isNaN(val) ? val : parseFloat(val) || val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  const CROPS = ['Rice','Wheat','Maize','Sugarcane','Cotton(lint)','Groundnut','Soyabean','Potato','Onion','Banana','Coconut ','Jowar','Bajra','Barley','Gram','Arhar/Tur','Urad','Moong(Green Gram)','Jute','Ragi','Sesamum','Linseed','Sunflower','Turmeric','Ginger','Garlic','Black pepper','Cardamom','Cashewnut','Arecanut','Tobacco','Tapioca','Sweet potato','Dry chillies','Coriander'];
  const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
  const SEASONS = ['Kharif','Rabi','Summer','Winter','Whole Year','Autumn'];

  return (
    <div className="yield-prediction-page">
      <form className="glass-card input-form" onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="form-header">
          <h2>🌾 Crop Yield Prediction</h2>
          <p>Predict expected yield using real Indian agricultural data (19,577 records, 55 crops, 30 states)</p>
        </div>

        {/* Crop & Location */}
        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>🌱 Crop & Location</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>🌾 Crop</label>
            <select className="input-field" value={values.crop} onChange={e => handleChange('crop', e.target.value)}>
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>📍 State</label>
            <select className="input-field" value={values.state} onChange={e => handleChange('state', e.target.value)}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>🗓️ Season</label>
            <select className="input-field" value={values.season} onChange={e => handleChange('season', e.target.value)}>
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>📅 Year</label>
            <input className="input-field" type="number" value={values.year} min={1997} max={2030}
              onChange={e => handleChange('year', e.target.value)} />
          </div>
        </div>

        {/* Farm Details */}
        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>🚜 Farm Details</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>📐 Area (hectares)</label>
            <input className="input-field" type="number" value={values.area} step="10"
              onChange={e => handleChange('area', e.target.value)} />
          </div>
          <div className="form-group">
            <label>📦 Production (tonnes)</label>
            <input className="input-field" type="number" value={values.production} step="100"
              onChange={e => handleChange('production', e.target.value)} />
          </div>
          <div className="form-group">
            <label>🧪 Fertilizer (kg)</label>
            <input className="input-field" type="number" value={values.fertilizer} step="1000"
              onChange={e => handleChange('fertilizer', e.target.value)} />
          </div>
          <div className="form-group">
            <label>🛡️ Pesticide (kg)</label>
            <input className="input-field" type="number" value={values.pesticide} step="10"
              onChange={e => handleChange('pesticide', e.target.value)} />
          </div>
        </div>

        {/* Soil Nutrients */}
        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>🧪 Soil Nutrients</h4>
        <div className="form-grid">
          {[
            { key: 'N', label: 'Nitrogen (N)', icon: '🧪' },
            { key: 'P', label: 'Phosphorus (P)', icon: '🔬' },
            { key: 'K', label: 'Potassium (K)', icon: '⚗️' },
            { key: 'pH', label: 'Soil pH', icon: '📐' },
          ].map(f => (
            <div className="form-group" key={f.key}>
              <label>{f.icon} {f.label}</label>
              <input className="input-field" type="number" step="0.1" value={values[f.key]}
                onChange={e => handleChange(f.key, e.target.value)} />
            </div>
          ))}
        </div>

        {/* Weather */}
        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>
          🌤️ Weather {weatherData && <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>✓ Auto-filled from live data</span>}
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label>🌡️ Avg Temperature (°C)</label>
            <input className="input-field" type="number" step="0.1" value={values.avg_temp_c}
              onChange={e => handleChange('avg_temp_c', e.target.value)} />
          </div>
          <div className="form-group">
            <label>🌧️ Total Rainfall (mm)</label>
            <input className="input-field" type="number" step="10" value={values.total_rainfall_mm}
              onChange={e => handleChange('total_rainfall_mm', e.target.value)} />
          </div>
          <div className="form-group">
            <label>💧 Avg Humidity (%)</label>
            <input className="input-field" type="number" step="1" value={values.avg_humidity_percent}
              onChange={e => handleChange('avg_humidity_percent', e.target.value)} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (<><span className="spinner"></span> Predicting...</>) : (<>🌾 Predict Yield</>)}
          </button>
        </div>
      </form>

      {/* Result Card */}
      {result && (
        <div className="glass-card" style={{ maxWidth: '500px', margin: '24px auto', textAlign: 'center', padding: '32px' }}>
          <h3>🌾 Yield Prediction Result</h3>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)', margin: '16px 0' }}>
            {result.yield_value}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{result.unit}</p>
          <div style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: '20px', marginTop: '12px',
            fontWeight: '600', fontSize: '0.95rem',
            backgroundColor: result.yield_category === 'Very High' ? '#059669' :
              result.yield_category === 'High' ? '#16a34a' :
              result.yield_category === 'Medium' ? '#d97706' : '#dc2626',
            color: '#fff',
          }}>
            {result.yield_category} Yield
          </div>
          <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            {result.crop} — {result.state} ({result.season})
          </p>
        </div>
      )}
    </div>
  );
}

/* ── SRIKAKULAM FARMER FORM ── */
function SrikakulamFarmerForm({ onSubmit, loading, result }) {
  const [subTab, setSubTab] = useState('macro');
  const [macroValues, setMacroValues] = useState({
    type: 'macro', block_enc: 0, total_samples: 150,
    n_high_pct: 0.0, n_med_pct: 0.15, n_low_pct: 0.85,
    p_high_pct: 0.0, p_med_pct: 0.5, p_low_pct: 0.5,
    k_high_pct: 0.4, k_med_pct: 0.6, k_low_pct: 0.0,
    oc_high_pct: 0.1, oc_med_pct: 0.5, ph_neut_pct: 0.95,
    ph_acid_pct: 0.03, ec_nonsaline_pct: 0.97,
  });
  const [microValues, setMicroValues] = useState({
    type: 'micro', block_enc: 0, total_samples: 150,
    s_suf_pct: 0.99, fe_suf_pct: 0.99, zn_suf_pct: 0.98,
    cu_suf_pct: 1.0, b_suf_pct: 0.85, mn_suf_pct: 1.0,
    s_def: 0, fe_def: 0, zn_def: 0, cu_def: 0, b_def: 0, mn_def: 0,
    deficiency_count: 0,
  });

  const BLOCKS = ['AMADALAVALASA','BURJA','ETCHERLA','GANGUVARISIGADAM','GARA','HIRAMANDALAM','ICHAPURAM','JALUMURU','KANCHILI','KAVITI','KOTABOMMILI','KOTTURU','L.N PETA','LAVERU','MANDASA','MELIAPUTTI','NANDIGAM','NARASANNAPETA','PALASA','PATHAPATNAM','POLAKI','PONDURU','RANASTALAM','SANTHABOMMALI','SARAVAKOTA','SARUBUJJILI','SOMPETA','SRIKAKULAM','TEKKALI','VAJRAPUKOTTURU'];

  function handleMacro(key, val) { setMacroValues(p => ({ ...p, [key]: parseFloat(val) || 0 })); }
  function handleMicro(key, val) { setMicroValues(p => ({ ...p, [key]: parseFloat(val) || 0 })); }

  return (
    <div className="yield-prediction-page">
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        <button className={`tab-btn ${subTab === 'macro' ? 'active' : ''}`}
          onClick={() => setSubTab('macro')}>🧪 Macro Nutrients</button>
        <button className={`tab-btn ${subTab === 'micro' ? 'active' : ''}`}
          onClick={() => setSubTab('micro')}>🔬 Micro Nutrients</button>
      </div>

      {subTab === 'macro' && (
        <form className="glass-card input-form" onSubmit={e => { e.preventDefault(); onSubmit(macroValues); }}
          style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="form-header">
            <h2>🧪 Macro Nutrient Analysis — Srikakulam</h2>
            <p>Predict soil nitrogen status based on macro nutrient percentages</p>
          </div>
          <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>📍 Block Selection</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Block</label>
              <select className="input-field" value={macroValues.block_enc}
                onChange={e => handleMacro('block_enc', e.target.value)}>
                {BLOCKS.map((b, i) => <option key={b} value={i}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Total Samples</label>
              <input className="input-field" type="number" value={macroValues.total_samples}
                onChange={e => handleMacro('total_samples', e.target.value)} />
            </div>
          </div>

          <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>📊 Nutrient Percentages (0.0 - 1.0)</h4>
          <div className="form-grid">
            {[
              { key: 'n_high_pct', label: 'N High %' }, { key: 'n_med_pct', label: 'N Medium %' }, { key: 'n_low_pct', label: 'N Low %' },
              { key: 'p_high_pct', label: 'P High %' }, { key: 'p_med_pct', label: 'P Medium %' },
              { key: 'k_high_pct', label: 'K High %' }, { key: 'k_med_pct', label: 'K Medium %' },
              { key: 'oc_high_pct', label: 'OC High %' }, { key: 'oc_med_pct', label: 'OC Medium %' },
              { key: 'ph_neut_pct', label: 'pH Neutral %' }, { key: 'ph_acid_pct', label: 'pH Acidic %' },
              { key: 'ec_nonsaline_pct', label: 'EC Non-Saline %' },
            ].map(f => (
              <div className="form-group" key={f.key}>
                <label>{f.label}</label>
                <input className="input-field" type="number" step="0.01" min="0" max="1"
                  value={macroValues[f.key]} onChange={e => handleMacro(f.key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (<><span className="spinner"></span> Analyzing...</>) : (<>🧪 Analyze Macro</>)}
            </button>
          </div>
        </form>
      )}

      {subTab === 'micro' && (
        <form className="glass-card input-form" onSubmit={e => { e.preventDefault(); onSubmit(microValues); }}
          style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="form-header">
            <h2>🔬 Micro Nutrient Analysis — Srikakulam</h2>
            <p>Predict micro nutrient sufficiency status (S, Fe, Zn, Cu, B, Mn)</p>
          </div>
          <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>📍 Block Selection</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Block</label>
              <select className="input-field" value={microValues.block_enc}
                onChange={e => handleMicro('block_enc', e.target.value)}>
                {BLOCKS.map((b, i) => <option key={b} value={i}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Total Samples</label>
              <input className="input-field" type="number" value={microValues.total_samples}
                onChange={e => handleMicro('total_samples', e.target.value)} />
            </div>
          </div>

          <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>📊 Sufficiency % & Deficiency Flags</h4>
          <div className="form-grid">
            {[
              { key: 's_suf_pct', label: 'S Sufficient %' }, { key: 'fe_suf_pct', label: 'Fe Sufficient %' },
              { key: 'zn_suf_pct', label: 'Zn Sufficient %' }, { key: 'cu_suf_pct', label: 'Cu Sufficient %' },
              { key: 'b_suf_pct', label: 'B Sufficient %' }, { key: 'mn_suf_pct', label: 'Mn Sufficient %' },
            ].map(f => (
              <div className="form-group" key={f.key}>
                <label>{f.label}</label>
                <input className="input-field" type="number" step="0.01" min="0" max="1"
                  value={microValues[f.key]} onChange={e => handleMicro(f.key, e.target.value)} />
              </div>
            ))}
            {['s_def','fe_def','zn_def','cu_def','b_def','mn_def'].map(f => (
              <div className="form-group" key={f}>
                <label>{f.replace('_def','').toUpperCase()} Deficient (0/1)</label>
                <select className="input-field" value={microValues[f]} onChange={e => handleMicro(f, e.target.value)}>
                  <option value="0">No (0)</option>
                  <option value="1">Yes (1)</option>
                </select>
              </div>
            ))}
            <div className="form-group">
              <label>Total Deficiency Count</label>
              <input className="input-field" type="number" min="0" max="6"
                value={microValues.deficiency_count} onChange={e => handleMicro('deficiency_count', e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (<><span className="spinner"></span> Analyzing...</>) : (<>🔬 Analyze Micro</>)}
            </button>
          </div>
        </form>
      )}

      {/* Result Card */}
      {result && (
        <div className="glass-card" style={{ maxWidth: '500px', margin: '24px auto', textAlign: 'center', padding: '32px' }}>
          <h3>🏔️ Srikakulam Prediction ({result.nutrient_type})</h3>
          <div style={{
            fontSize: '2.2rem', fontWeight: '800', margin: '16px 0',
            color: result.prediction === 'Low' || result.prediction === 'Deficient' ? '#dc2626' :
                   result.prediction === 'Sufficient' || result.prediction === 'High' ? '#16a34a' : '#d97706',
          }}>
            {result.prediction}
          </div>
          {result.probabilities && Object.keys(result.probabilities).length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Confidence:</p>
              {Object.entries(result.probabilities).map(([cls, pct]) => (
                <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px auto', maxWidth: '300px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right', fontSize: '0.85rem' }}>{cls}</span>
                  <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px',
                      background: pct > 50 ? '#16a34a' : '#d97706' }} />
                  </div>
                  <span style={{ minWidth: '45px', fontSize: '0.85rem', fontWeight: '600' }}>{pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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


