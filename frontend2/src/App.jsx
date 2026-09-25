import { useState, useEffect } from 'react';
import { isLoggedIn, getUser, logout, loginSendOTP, loginVerifyOTP, signupSendOTP, signupVerifyOTP, loginPassword, registerPassword, predictCrop, predictYield, predictAgriYield, getWeather, getSrikakulamAnalysis, predictSrikakulam, getAdminStats, getAdminUsers, getModelComparison, getTrainingDetails, getYieldComparison, getKFoldResults } from './api';
import AP_DATA from './ap_data.json';

// ═══ CROP-NUTRIENT MAPPING ═══
const CROP_NUTRIENT_DB = [
  { crop: 'Rice', n: 'high', p: 'medium', k: 'medium', soil: 'Clayey, loamy', season: 'Kharif' },
  { crop: 'Wheat', n: 'medium', p: 'medium', k: 'medium', soil: 'Loamy, alluvial', season: 'Rabi' },
  { crop: 'Maize', n: 'high', p: 'medium', k: 'high', soil: 'Sandy loam', season: 'Kharif/Rabi' },
  { crop: 'Sugarcane', n: 'high', p: 'high', k: 'high', soil: 'Loamy', season: 'Annual' },
  { crop: 'Cotton', n: 'medium', p: 'low', k: 'medium', soil: 'Black soil', season: 'Kharif' },
  { crop: 'Groundnut', n: 'low', p: 'medium', k: 'medium', soil: 'Sandy loam', season: 'Kharif' },
  { crop: 'Banana', n: 'high', p: 'medium', k: 'high', soil: 'Loamy, alluvial', season: 'Annual' },
  { crop: 'Coconut', n: 'medium', p: 'low', k: 'high', soil: 'Sandy, laterite', season: 'Annual' },
  { crop: 'Mango', n: 'medium', p: 'low', k: 'medium', soil: 'Deep loamy', season: 'Annual' },
  { crop: 'Cashew', n: 'low', p: 'low', k: 'low', soil: 'Sandy, laterite', season: 'Annual' },
  { crop: 'Black Gram', n: 'low', p: 'medium', k: 'low', soil: 'Loamy', season: 'Kharif/Rabi' },
  { crop: 'Green Gram', n: 'low', p: 'medium', k: 'low', soil: 'Sandy loam', season: 'Kharif' },
  { crop: 'Red Gram', n: 'low', p: 'medium', k: 'medium', soil: 'Red, black soil', season: 'Kharif' },
  { crop: 'Sesame', n: 'medium', p: 'low', k: 'low', soil: 'Sandy loam', season: 'Kharif' },
  { crop: 'Turmeric', n: 'high', p: 'medium', k: 'high', soil: 'Loamy, clay', season: 'Kharif' },
  { crop: 'Chilli', n: 'medium', p: 'medium', k: 'medium', soil: 'Sandy loam', season: 'Kharif/Rabi' },
  { crop: 'Jowar', n: 'medium', p: 'low', k: 'low', soil: 'Black, red soil', season: 'Kharif/Rabi' },
  { crop: 'Ragi', n: 'low', p: 'low', k: 'medium', soil: 'Red, laterite', season: 'Kharif' },
  { crop: 'Sunflower', n: 'medium', p: 'medium', k: 'low', soil: 'Black soil', season: 'Rabi' },
  { crop: 'Jute', n: 'high', p: 'medium', k: 'medium', soil: 'Alluvial, loamy', season: 'Kharif' },
  { crop: 'Tobacco', n: 'high', p: 'medium', k: 'high', soil: 'Sandy loam', season: 'Rabi' },
  { crop: 'Sweet Potato', n: 'low', p: 'medium', k: 'high', soil: 'Sandy loam', season: 'Kharif' },
];

function getRegionalCrops(bd) {
  if (!bd) return [];
  const tot = bd.samples;
  const nLowPct = (bd.N_L / tot) * 100, pLowPct = (bd.P_L / tot) * 100, kHighPct = (bd.K_H / tot) * 100;
  const nLvl = nLowPct > 70 ? 'low' : nLowPct > 30 ? 'medium' : 'high';
  const pLvl = pLowPct > 70 ? 'low' : pLowPct > 30 ? 'medium' : 'high';
  const kLvl = kHighPct > 50 ? 'high' : kHighPct > 20 ? 'medium' : 'low';
  const lvls = ['low', 'medium', 'high'];
  return CROP_NUTRIENT_DB.map(c => {
    let sc = 10;
    if (c.n === nLvl) sc += 35; else if (Math.abs(lvls.indexOf(c.n) - lvls.indexOf(nLvl)) === 1) sc += 15;
    if (c.p === pLvl) sc += 30; else if (Math.abs(lvls.indexOf(c.p) - lvls.indexOf(pLvl)) === 1) sc += 12;
    if (c.k === kLvl) sc += 25; else if (Math.abs(lvls.indexOf(c.k) - lvls.indexOf(kLvl)) === 1) sc += 10;
    return { ...c, score: Math.min(sc, 100) };
  }).sort((a, b) => b.score - a.score);
}

// ═══ POPUP COMPONENT ═══
function Popup({ type, title, message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()}>
        <div className={`popup-icon ${type}`}>
          {type === 'success' && <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="#16a34a" strokeWidth="2.5"/><path d="M11 18l5 5 9-10" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:60, animation:'checkDraw 0.6s ease forwards'}}/></svg>}
          {type === 'celebrate' && <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="#d97706" strokeWidth="2.5"/><text x="18" y="23" textAnchor="middle" fontSize="18" fill="#d97706">★</text></svg>}
        </div>
        <div className="popup-title">{title}</div>
        <div className="popup-sub">{message}</div>
        <button className="popup-close" onClick={onClose}>Continue</button>
      </div>
    </div>
  );
}

// ═══ APP ═══
export default function App() {
  const [page, setPage] = useState(isLoggedIn() ? 'dashboard' : 'landing');
  const [user, setUser] = useState(getUser());
  const [popup, setPopup] = useState(null);

  function handleLogin(userData) {
    setUser(userData);
    setPopup({ type: 'success', title: 'Login Successful', message: `Welcome back, ${userData.name || userData.username || 'Farmer'}! Your dashboard is ready.` });
    setPage('dashboard');
  }
  function handleLogout() { logout(); setUser({}); setPage('landing'); }

  if (page === 'landing') return <LandingPage onGetStarted={() => setPage('auth')} />;
  if (page === 'auth') return <AuthPage onLogin={handleLogin} onBack={() => setPage('landing')} />;
  return (
    <>
      {popup && <Popup {...popup} onClose={() => setPopup(null)} />}
      {user.role === 'admin'
        ? <AdminDashboard user={user} onLogout={handleLogout} />
        : <Dashboard user={user} onLogout={handleLogout} onPopup={setPopup} />
      }
    </>
  );
}

// ═══ LANDING ═══
function LandingPage({ onGetStarted }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="logo"><div className="logo-dot"></div> QuantumSoil</div>
        <button className="btn-primary" style={{borderRadius:'50px'}} onClick={onGetStarted}>Get Started</button>
      </nav>

      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="leaf-container">
          <div className="leaf" style={{color:'#86efac'}}>&#127807;</div>
          <div className="leaf" style={{color:'#4ade80'}}>&#127793;</div>
          <div className="leaf" style={{color:'#a7f3d0'}}>&#127807;</div>
          <div className="leaf" style={{color:'#86efac'}}>&#127793;</div>
          <div className="leaf" style={{color:'#6ee7b7'}}>&#127807;</div>
        </div>
        <div className="hero">
          <div className="hero-badge">AI-Powered Agriculture</div>
          <h1>Smart Crop Recommendation <br /><span>& Soil Analysis System</span></h1>
          <p className="hero-sub">Leverage quantum-enhanced machine learning to analyze soil nutrients, predict optimal crops, estimate yield, and get region-specific agricultural insights for all Andhra Pradesh districts.</p>
          <div className="hero-actions"><button className="btn-primary btn-lg" onClick={onGetStarted}>Start Analysis</button></div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">69</span><span className="stat-label">ML Models</span></div>
            <div className="stat"><span className="stat-num">99.7%</span><span className="stat-label">Accuracy</span></div>
            <div className="stat"><span className="stat-num">27</span><span className="stat-label">Districts</span></div>
            <div className="stat"><span className="stat-num">604</span><span className="stat-label">Blocks</span></div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Three Powerful Modules</h2>
        <p className="features-sub">Data-driven agricultural intelligence for Indian farmers</p>
        <div className="features-grid">
          <div className="feature-card"><div className="feature-icon">CR</div><h3>Crop Recommendation</h3><p>Enter soil parameters (N, P, K, pH, temperature, humidity, rainfall) and get the best crop recommendation using 21 ML models with SHAP explainability.</p></div>
          <div className="feature-card"><div className="feature-icon">YP</div><h3>Yield Prediction</h3><p>Predict crop yield in tonnes/hectare using 18 regression models trained on 19,577 real records across 55 crops and 30 Indian states.</p></div>
          <div className="feature-card"><div className="feature-icon">RA</div><h3>Regional Analysis</h3><p>Get block-level soil health insights for all 27 Andhra Pradesh districts with macro and micro nutrient analysis and crop recommendations.</p></div>
        </div>
      </section>
      <footer className="landing-footer"><p>Quantum-Enhanced Soil Nutrient Analysis & Multi-Crop Recommendation System</p></footer>
    </div>
  );
}

// ═══ AUTH ═══
function AuthPage({ onLogin, onBack }) {
  const [mode, setMode] = useState('login');
  const [authMethod, setAuthMethod] = useState('password');
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(''); const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault(); setErr(''); setMsg(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await registerPassword(username || email, email, password, name, phone);
        if (res.error || res.username || res.password || res.email) setErr(res.error || Object.values(res).flat().join(', '));
        else if (res.token) onLogin(res.user || { email, name });
      } else {
        const res = await loginPassword(username || email, password);
        if (res.error) setErr(res.error); else if (res.token) onLogin(res.user || { email });
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }
  async function handleSendOTP(e) {
    e.preventDefault(); setErr(''); setMsg(''); setLoading(true);
    try {
      const res = mode === 'login' ? await loginSendOTP(email) : await signupSendOTP(email, name, phone);
      if (res.error) setErr(res.error); else { setMsg(res.message || 'OTP sent!'); setStep(2); }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }
  async function handleVerifyOTP(e) {
    e.preventDefault(); setErr(''); setMsg(''); setLoading(true);
    try {
      const res = mode === 'login' ? await loginVerifyOTP(email, otp) : await signupVerifyOTP(email, otp);
      if (res.error) setErr(res.error); else if (res.token) onLogin(res.user || { email });
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <button className="back-btn" onClick={onBack}>Back</button>
      <div className="auth-card">
        <div className="auth-header"><h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2><p>{mode === 'login' ? 'Login to your account' : 'Sign up to get started'}</p></div>
        <div className="auth-toggle">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setStep(1); setErr(''); setMsg(''); }}>Login</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setStep(1); setErr(''); setMsg(''); }}>Sign Up</button>
        </div>
        <div className="auth-method">
          <button className={authMethod === 'password' ? 'active' : ''} onClick={() => { setAuthMethod('password'); setStep(1); setErr(''); setMsg(''); }}>Password</button>
          <button className={authMethod === 'otp' ? 'active' : ''} onClick={() => { setAuthMethod('otp'); setStep(1); setErr(''); setMsg(''); }}>Email OTP</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        {authMethod === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            {mode === 'signup' && (<><div className="form-group"><label>Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required /></div>
            <div className="form-group"><label>Phone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" /></div></>)}
            <div className="form-group"><label>{mode === 'signup' ? 'Username' : 'Username or Email'}</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={mode === 'signup' ? 'Choose a username' : 'e.g. admin@49'} required /></div>
            {mode === 'signup' && (<div className="form-group"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required /></div>)}
            <div className="form-group"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required /></div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>{loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Sign Up')}</button>
          </form>
        )}
        {authMethod === 'otp' && step === 1 && (
          <form onSubmit={handleSendOTP}>
            {mode === 'signup' && (<><div className="form-group"><label>Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required /></div>
            <div className="form-group"><label>Phone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" /></div></>)}
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required /></div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
          </form>
        )}
        {authMethod === 'otp' && step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group"><label>OTP sent to {email}</label><input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} required /></div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Login'}</button>
            <button type="button" className="btn-link" onClick={() => setStep(1)}>Change email</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ═══ DASHBOARD ═══
function Dashboard({ user, onLogout, onPopup }) {
  const [tab, setTab] = useState('crop');
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    const fetch = (lat, lon) => getWeather(lat, lon).then(setWeather).catch(() => {});
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => fetch(p.coords.latitude, p.coords.longitude), () => fetch(18.3, 83.9));
    else fetch(18.3, 83.9);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">QuantumSoil</div>
        {weather && <div className="weather-mini">{weather.temperature}°C | {weather.humidity}% humidity | {weather.rainfall}mm rain</div>}
        <div className="user-area">
          <span className="user-badge">{(user.name || user.email || 'U')[0].toUpperCase()}</span>
          <span className="user-name">{user.name || user.email || 'Farmer'}</span>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <nav className="tab-nav">
        {[{ key: 'crop', label: 'Crop Recommendation' }, { key: 'yield', label: 'Yield Prediction' }, { key: 'regional', label: 'Regional Analysis' }].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </nav>
      <main className="main">
        {tab === 'crop' && <CropTab weather={weather} />}
        {tab === 'yield' && <YieldTab weather={weather} onPopup={onPopup} />}
        {tab === 'regional' && <RegionalTab />}
      </main>
      <footer className="app-footer"><p>Quantum-Enhanced Soil Nutrient Analysis & Multi-Crop Recommendation System</p></footer>
    </div>
  );
}

// ═══ TAB 1: CROP RECOMMENDATION ═══
function CropTab({ weather }) {
  const [form, setForm] = useState({ nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.88, humidity: 82.0, ph: 6.5, rainfall: 202.94 });
  const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState('');

  useEffect(() => { if (weather) setForm(f => ({ ...f, temperature: weather.temperature || f.temperature, humidity: weather.humidity || f.humidity, rainfall: weather.rainfall || f.rainfall })); }, [weather]);

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setErr(''); setResult(null);
    try {
      const d = {}; Object.entries(form).forEach(([k, v]) => { d[k] = parseFloat(v) || 0; });
      const res = await predictCrop(d);
      setResult(res);
    } catch (e) { setErr(e.message || 'Prediction failed. Please ensure the backend is running and models are trained.'); }
    setLoading(false);
  }
  const fields = [
    { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'mg/kg', ph: '0-300' }, { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'mg/kg', ph: '5-145' },
    { key: 'potassium', label: 'Potassium (K)', unit: 'mg/kg', ph: '5-205' }, { key: 'temperature', label: 'Temperature', unit: '°C', ph: '8-44' },
    { key: 'humidity', label: 'Humidity', unit: '%', ph: '14-100' }, { key: 'ph', label: 'pH Level', unit: 'pH', ph: '3.5-10' },
    { key: 'rainfall', label: 'Rainfall', unit: 'mm', ph: '20-300' },
  ];

  // Map backend response fields
  const topCrops = result?.top_3_crops || result?.top_crops || [];
  const shapData = result?.shap_explanation || result?.shap_features || [];

  return (
    <div className="tab-content animate-in">
      <div className="section-card">
        <div className="card-header"><h2>Soil-Based Crop Recommendation</h2><p>Enter soil parameters to get the best crop from 21 ML models with SHAP explainability</p></div>
        {weather && <div className="weather-banner"><span>Weather auto-filled:</span> {weather.temperature}°C, {weather.humidity}% humidity, {weather.rainfall}mm</div>}
        <form className="input-grid" onSubmit={handleSubmit}>
          {fields.map(f => (<div className="input-group" key={f.key}><label>{f.label} <small>({f.unit})</small></label><input type="number" step="0.01" placeholder={f.ph} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required /></div>))}
          <div className="input-group full-width"><button type="submit" className="btn-primary btn-lg btn-full" disabled={loading}>{loading ? <><span className="spinner"></span> Analyzing...</> : 'Analyze & Recommend'}</button></div>
        </form>
        {err && <div className="alert alert-error">{err}</div>}
      </div>
      {result && (
        <div className="result-section">
          <div className="result-hero"><div className="result-badge">Recommended Crop</div><div className="result-crop">{result.recommended_crop || result.prediction}</div>
            <div className="result-confidence">{result.confidence ? `${(result.confidence * 100).toFixed(1)}% Confidence` : ''}</div></div>
          {topCrops.length > 0 && <div className="section-card"><h3>Top Crop Recommendations</h3><div className="crop-list">
            {topCrops.slice(0, 5).map((c, i) => (<div className="crop-item" key={i}><span className="crop-rank">#{i + 1}</span><span className="crop-name">{c.crop}</span>
              <div className="crop-bar-wrap"><div className="crop-bar" style={{ width: `${c.probability * 100}%` }}></div></div><span className="crop-pct">{(c.probability * 100).toFixed(1)}%</span></div>))}
          </div></div>}
          {result.nutrient_analysis && <div className="section-card"><h3>Nutrient Analysis</h3><div className="nutrient-grid">
            {Object.entries(result.nutrient_analysis).map(([key, val]) => (
              <div className="nutrient-card" key={key}><h4>{key}</h4><div className={`nutrient-status ${val.status === 'adequate' || val.status === 'high' ? 'good' : 'bad'}`}>{val.status}</div>
              <p style={{fontSize:'0.8rem',color:'var(--text-m)',marginTop:4}}>{val.recommendation || ''}</p></div>
            ))}
          </div></div>}
          {result.soil_health && <div className="section-card"><h3>Soil Health Score</h3><div className="health-score">
            <div className="health-circle" style={{ '--score': result.soil_health.score / 100 }}><span>{result.soil_health.score}</span></div><span className="health-label">{result.soil_health.category}</span></div></div>}
          {shapData.length > 0 && <div className="section-card"><h3>Feature Importance (SHAP)</h3><div className="shap-bars">
            {shapData.map((f, i) => (<div className="shap-item" key={i}><span className="shap-name">{f.feature}</span>
              <div className="shap-bar-wrap"><div className="shap-bar" style={{ width: `${Math.abs(f.importance) * 100}%`, background: f.importance > 0 ? '#16a34a' : '#dc2626' }}></div></div><span className="shap-val">{(f.importance * 100).toFixed(1)}%</span></div>))}
          </div></div>}
          {result.quantum_comparison && result.quantum_comparison.quantum_accuracy > 0 && <div className="section-card"><h3>Quantum vs Classical</h3><div className="stats-grid">
            <div className="stat-card"><span className="stat-num">{(result.quantum_comparison.quantum_accuracy*100).toFixed(1)}%</span><span className="stat-label">Quantum Accuracy</span></div>
            <div className="stat-card"><span className="stat-num">{(result.quantum_comparison.classical_accuracy*100).toFixed(1)}%</span><span className="stat-label">Classical Accuracy</span></div>
            <div className="stat-card"><span className="stat-num">{result.quantum_comparison.n_qubits}</span><span className="stat-label">Qubits Used</span></div>
          </div></div>}
        </div>
      )}
    </div>
  );
}

// ═══ TAB 2: YIELD PREDICTION (46 features from Agri_yield_prediction.csv) ═══
function YieldTab({ weather, onPopup }) {
  const [form, setForm] = useState({
    // Crop & Location (dropdowns keep defaults)
    Crop_Type: 'Rice', Soil_Type: 'Loamy', Region: 'South', Season: 'Kharif', Year: '',
    Growth_Stage: 'Vegetative', Planting_Date: '', Harvest_Date: '',
    // Farm Management
    Irrigation_Frequency: '', Fertilizer_Type: 'Mixed', Pesticide_Usage: 'Medium',
    // Weather — auto-filled from API
    Temperature: '', Humidity: '', Rainfall: '', Solar_Radiation: '', Wind_Speed: '', GDD: '',
    // Macro Nutrients — farmer fills
    N: '', P: '', K: '', Ca: '', Mg: '', S: '',
    // Micro Nutrients — farmer fills
    Zn: '', Fe: '', Cu: '', Mn: '', B: '', Mo: '',
    // Soil Chemistry — farmer fills
    pH: '', EC: '', OC: '', CEC: '',
    // Soil Physics — farmer fills
    Sand: '', Silt: '', Clay: '', Bulk_Density: '', Water_Holding_Capacity: '',
    // Vegetation Indices — farmer fills
    NDVI: '', EVI: '', LAI: '', Chlorophyll: '',
    // Terrain — farmer fills
    Slope: '', Aspect: '', Elevation: '',
  });
  const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState('');

  useEffect(() => {
    if (weather) setForm(f => ({ ...f, Temperature: weather.temperature || f.Temperature, Humidity: weather.humidity || f.Humidity, Rainfall: weather.rainfall || f.Rainfall }));
  }, [weather]);

  function ch(k, v) { setForm(p => ({ ...p, [k]: isNaN(v) ? v : parseFloat(v) || v })); }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setResult(null); setErr('');
    try {
      const r = await predictAgriYield(form); setResult(r);
      if (r.yield_category === 'Very High' || r.yield_category === 'High') {
        onPopup({ type: 'celebrate', title: 'Excellent Yield Predicted!', message: `Your ${r.crop || form.Crop_Type} yield is ${r.yield_value} tonnes/ha — "${r.yield_category}". Great conditions!` });
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  function fmtYield(v) { if (!v) return '—'; const n = parseFloat(v); if (isNaN(n)) return v; return n.toFixed(3); }

  const CROPS = ['Rice','Wheat','Maize','Soybean'];
  const SOILS = ['Sandy','Clayey','Loamy','Silty'];
  const REGIONS = ['North','South','East','West'];
  const SEASONS = ['Kharif','Rabi','Zaid'];
  const STAGES = ['Vegetative','Reproductive','Maturity'];
  const FERT_TYPES = ['Organic','Chemical','Mixed'];
  const PEST_LEVELS = ['Low','Medium','High'];

  function SelectField({ label, k, options }) {
    return (<div className="input-group"><label>{label}</label><select value={form[k]} onChange={e => ch(k, e.target.value)}>{options.map(o => <option key={o}>{o}</option>)}</select></div>);
  }
  function NumField({ label, k, unit, step = 0.1 }) {
    return (<div className="input-group"><label>{label} {unit && <small>({unit})</small>}</label><input type="number" step={step} value={form[k]} onChange={e => ch(k, e.target.value)} /></div>);
  }

  return (
    <div className="tab-content animate-in">
      <div className="section-card">
        <div className="card-header">
          <h2>Advanced Crop Yield Prediction</h2>
          <p>Predict using 46 features — soil nutrients, micro-nutrients, vegetation indices, terrain & weather data (10,000 records)</p>
        </div>
        {weather && <div className="weather-banner"><span>Weather auto-filled:</span> {weather.temperature}°C, {weather.humidity}% humidity, {weather.rainfall}mm</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Crop & Location</div>
          <div className="input-grid">
            <SelectField label="Crop Type" k="Crop_Type" options={CROPS} />
            <SelectField label="Soil Type" k="Soil_Type" options={SOILS} />
            <SelectField label="Region" k="Region" options={REGIONS} />
            <SelectField label="Season" k="Season" options={SEASONS} />
            <SelectField label="Growth Stage" k="Growth_Stage" options={STAGES} />
            <NumField label="Year" k="Year" step={1} />
            <div className="input-group"><label>Planting Date</label><input type="date" value={form.Planting_Date} onChange={e => ch('Planting_Date', e.target.value)} /></div>
            <div className="input-group"><label>Harvest Date</label><input type="date" value={form.Harvest_Date} onChange={e => ch('Harvest_Date', e.target.value)} /></div>
          </div>

          <div className="form-section-title">Farm Management</div>
          <div className="input-grid">
            <NumField label="Irrigation Frequency" k="Irrigation_Frequency" unit="times" step={1} />
            <SelectField label="Fertilizer Type" k="Fertilizer_Type" options={FERT_TYPES} />
            <SelectField label="Pesticide Usage" k="Pesticide_Usage" options={PEST_LEVELS} />
          </div>

          <div className="form-section-title">Weather & Climate {weather && <small style={{color:'#16a34a'}}> — auto-filled</small>}</div>
          <div className="input-grid">
            <NumField label="Temperature" k="Temperature" unit="°C" />
            <NumField label="Humidity" k="Humidity" unit="%" />
            <NumField label="Rainfall" k="Rainfall" unit="mm" step={10} />
            <NumField label="Solar Radiation" k="Solar_Radiation" unit="W/m²" step={50} />
            <NumField label="Wind Speed" k="Wind_Speed" unit="km/h" />
            <NumField label="GDD" k="GDD" unit="°C-days" step={50} />
          </div>

          <div className="form-section-title">Macro Nutrients</div>
          <div className="input-grid">
            <NumField label="Nitrogen (N)" k="N" unit="kg/ha" />
            <NumField label="Phosphorus (P)" k="P" unit="kg/ha" />
            <NumField label="Potassium (K)" k="K" unit="kg/ha" />
            <NumField label="Calcium (Ca)" k="Ca" unit="ppm" step={10} />
            <NumField label="Magnesium (Mg)" k="Mg" unit="ppm" step={10} />
            <NumField label="Sulphur (S)" k="S" unit="ppm" />
          </div>

          <div className="form-section-title">Micro Nutrients</div>
          <div className="input-grid">
            <NumField label="Zinc (Zn)" k="Zn" unit="ppm" />
            <NumField label="Iron (Fe)" k="Fe" unit="ppm" />
            <NumField label="Copper (Cu)" k="Cu" unit="ppm" />
            <NumField label="Manganese (Mn)" k="Mn" unit="ppm" />
            <NumField label="Boron (B)" k="B" unit="ppm" />
            <NumField label="Molybdenum (Mo)" k="Mo" unit="ppm" />
          </div>

          <div className="form-section-title">Soil Chemistry</div>
          <div className="input-grid">
            <NumField label="Soil pH" k="pH" />
            <NumField label="EC" k="EC" unit="dS/m" />
            <NumField label="Organic Carbon (OC)" k="OC" unit="%" />
            <NumField label="CEC" k="CEC" unit="cmol/kg" />
          </div>

          <div className="form-section-title">Soil Physical Properties</div>
          <div className="input-grid">
            <NumField label="Sand" k="Sand" unit="%" />
            <NumField label="Silt" k="Silt" unit="%" />
            <NumField label="Clay" k="Clay" unit="%" />
            <NumField label="Bulk Density" k="Bulk_Density" unit="g/cm³" />
            <NumField label="Water Holding Capacity" k="Water_Holding_Capacity" unit="%" />
          </div>

          <div className="form-section-title">Vegetation Indices</div>
          <div className="input-grid">
            <NumField label="NDVI" k="NDVI" />
            <NumField label="EVI" k="EVI" />
            <NumField label="LAI" k="LAI" />
            <NumField label="Chlorophyll" k="Chlorophyll" unit="µg/cm²" />
          </div>

          <div className="form-section-title">Terrain</div>
          <div className="input-grid">
            <NumField label="Slope" k="Slope" unit="°" />
            <NumField label="Aspect" k="Aspect" unit="°" step={10} />
            <NumField label="Elevation" k="Elevation" unit="m" step={50} />
          </div>

          <div className="input-group full-width" style={{ marginTop: 16 }}>
            <button type="submit" className="btn-primary btn-lg btn-full" disabled={loading}>{loading ? <><span className="spinner"></span> Predicting...</> : 'Predict Yield (46 Features)'}</button>
          </div>
        </form>
        {err && <div className="alert alert-error">{err}</div>}
      </div>
      {result && (
        <div className="result-section">
          <div className="result-hero">
            <div className="result-badge">Predicted Yield</div>
            <div className="result-crop">{fmtYield(result.yield_value)} <small style={{ fontSize: '0.85rem', fontWeight: 400 }}>tonnes/ha</small></div>
            <div className="result-confidence" style={{ color: result.yield_category === 'Very High' ? '#059669' : result.yield_category === 'High' ? '#16a34a' : result.yield_category === 'Medium' ? '#d97706' : '#dc2626' }}>{result.yield_category} Yield</div>
            <p className="result-meta">{result.crop} — {result.region} ({result.season}) | {result.total_features} features used</p>
          </div>
          {result.model_comparison && Object.keys(result.model_comparison).length > 0 && (
            <div className="section-card"><h3>Model Comparison (R² Scores)</h3><div className="stats-grid">
              {Object.entries(result.model_comparison).map(([name, m]) => (
                <div className="stat-card" key={name}><span className="stat-num">{m.r2}</span><span className="stat-label">{name.replace(/_/g,' ')}</span></div>
              ))}
            </div></div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ TAB 3: REGIONAL ANALYSIS — ALL 27 AP DISTRICTS ═══
function RegionalTab() {
  const districts = Object.keys(AP_DATA).sort();
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [blockData, setBlockData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const blocks = district ? (AP_DATA[district] || []).map(b => b.block).sort() : [];

  function handleDistrictChange(d) {
    setDistrict(d); setBlock(''); setBlockData(null); setRecommendations([]);
  }
  function handleBlockChange(b) {
    setBlock(b);
    if (district && b) {
      const bd = AP_DATA[district].find(x => x.block === b);
      setBlockData(bd);
      if (bd) setRecommendations(getRegionalCrops(bd));
    } else { setBlockData(null); setRecommendations([]); }
  }

  function pct(num, tot) { return tot > 0 ? ((num / tot) * 100).toFixed(1) : '0'; }

  return (
    <div className="tab-content animate-in">
      <div className="section-card">
        <div className="card-header"><h2>Regional Crop Recommendation — Andhra Pradesh</h2><p>Select a district and block to see soil health and crop recommendations based on Soil Health Card RKVY data</p></div>
        <div className="selector-row">
          <div className="selector-group">
            <label>District</label>
            <select className="selector-dropdown" value={district} onChange={e => handleDistrictChange(e.target.value)}>
              <option value="">— Select District ({districts.length} available) —</option>
              {districts.map(d => <option key={d} value={d}>{d} ({(AP_DATA[d] || []).length} blocks)</option>)}
            </select>
          </div>
          <div className="selector-group">
            <label>Block / Mandal</label>
            <select className="selector-dropdown" value={block} onChange={e => handleBlockChange(e.target.value)} disabled={!district}>
              <option value="">{district ? `— Select Block (${blocks.length} available) —` : '— Select district first —'}</option>
              {blocks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
        {district && <p className="district-count">{district} has {blocks.length} blocks with soil nutrient data</p>}
      </div>

      {blockData && (
        <div className="animate-in">
          {/* Macro Nutrients */}
          <div className="section-card animate-slide" style={{ animationDelay: '0.05s' }}>
            <h3>Soil Nutrient Profile — {block}, {district}</h3>
            <p className="card-sub">Based on {blockData.samples} soil samples | Soil Health Card RKVY 2026-27</p>
            <div className="nutrient-grid">
              {[
                { name: 'Nitrogen (N)', h: blockData.N_H, m: blockData.N_M, l: blockData.N_L },
                { name: 'Phosphorus (P)', h: blockData.P_H, m: blockData.P_M, l: blockData.P_L },
                { name: 'Potassium (K)', h: blockData.K_H, m: blockData.K_M, l: blockData.K_L },
                { name: 'Organic Carbon', h: blockData.OC_H, m: blockData.OC_M, l: blockData.OC_L },
              ].map(n => {
                const tot = n.h + n.m + n.l;
                const hp = pct(n.h, tot), lp = pct(n.l, tot), mp = (100 - parseFloat(hp) - parseFloat(lp)).toFixed(1);
                const status = parseFloat(lp) > 60 ? 'Deficient' : 'Adequate';
                return (
                  <div className="nutrient-card" key={n.name}>
                    <h4>{n.name}</h4>
                    <div className={`nutrient-status ${status === 'Adequate' ? 'good' : 'bad'}`}>{status}</div>
                    <div className="nutrient-bars">
                      <div className="nbar"><span className="nbar-label">High</span><div className="nbar-track"><div className="nbar-fill high" style={{ width: `${hp}%` }}></div></div><span className="nbar-pct">{hp}%</span></div>
                      <div className="nbar"><span className="nbar-label">Med</span><div className="nbar-track"><div className="nbar-fill med" style={{ width: `${mp}%` }}></div></div><span className="nbar-pct">{mp}%</span></div>
                      <div className="nbar"><span className="nbar-label">Low</span><div className="nbar-track"><div className="nbar-fill low" style={{ width: `${lp}%` }}></div></div><span className="nbar-pct">{lp}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Micro Nutrients */}
          <div className="section-card animate-slide" style={{ animationDelay: '0.15s' }}>
            <h3>Micro Nutrient Sufficiency — {block}</h3>
            <div className="micro-grid">
              {[
                { el: 'S', s: blockData.S_S, d: blockData.S_D }, { el: 'Fe', s: blockData.Fe_S, d: blockData.Fe_D },
                { el: 'Zn', s: blockData.Zn_S, d: blockData.Zn_D }, { el: 'Cu', s: blockData.Cu_S, d: blockData.Cu_D },
                { el: 'B', s: blockData.B_S, d: blockData.B_D }, { el: 'Mn', s: blockData.Mn_S, d: blockData.Mn_D },
              ].map(m => {
                const tot = m.s + m.d;
                const sp = tot > 0 ? ((m.s / tot) * 100).toFixed(1) : 0;
                return (
                  <div className="micro-item" key={m.el}><span className="micro-name">{m.el}</span>
                    <div className="micro-bar-wrap"><div className="micro-bar" style={{ width: `${sp}%`, background: sp > 90 ? '#16a34a' : sp > 70 ? '#d97706' : '#dc2626' }}></div></div>
                    <span className="micro-pct">{sp}%</span></div>
                );
              })}
            </div>
          </div>

          {/* Crop Recommendations */}
          <div className="section-card animate-slide" style={{ animationDelay: '0.25s' }}>
            <h3>Recommended Crops for {block}, {district}</h3>
            <p className="card-sub">Based on soil nutrient levels — N: {pct(blockData.N_L, blockData.samples) > 70 ? 'Low' : pct(blockData.N_L, blockData.samples) > 30 ? 'Medium' : 'High'}, P: {pct(blockData.P_L, blockData.samples) > 70 ? 'Low' : pct(blockData.P_L, blockData.samples) > 30 ? 'Medium' : 'High'}, K: {pct(blockData.K_H, blockData.samples) > 50 ? 'High' : pct(blockData.K_H, blockData.samples) > 20 ? 'Medium' : 'Low'}</p>
            <div className="crop-rec-grid">
              {recommendations.slice(0, 10).map((c, i) => (
                <div className={`crop-rec-card ${i < 3 ? 'top' : ''}`} key={c.crop}>
                  <div className="crop-rec-rank">{i < 3 ? 'Top' : `#${i + 1}`}</div>
                  <div className="crop-rec-info"><h4>{c.crop}</h4>
                    <div className="crop-rec-tags"><span className="tag">N: {c.n}</span><span className="tag">P: {c.p}</span><span className="tag">K: {c.k}</span></div>
                    <p className="crop-rec-meta">{c.soil} — {c.season}</p></div>
                  <div className="crop-rec-score"><div className="score-ring" style={{ '--pct': c.score / 100 }}><span>{c.score}%</span></div><small>Match</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* District overview table */}
      {district && !block && (
        <div className="section-card animate-in">
          <h3>All Blocks in {district}</h3>
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Block</th><th>Samples</th><th>N Low%</th><th>P Low%</th><th>K High%</th><th>OC Low%</th></tr></thead>
            <tbody>
              {(AP_DATA[district] || []).map(b => {
                const nLp = pct(b.N_L, b.samples), pLp = pct(b.P_L, b.samples), kHp = pct(b.K_H, b.samples), ocLp = pct(b.OC_L, b.samples);
                return (<tr key={b.block} className="clickable" onClick={() => handleBlockChange(b.block)}>
                  <td><strong>{b.block}</strong></td><td>{b.samples}</td>
                  <td style={{ color: nLp > 80 ? '#dc2626' : '#16a34a' }}>{nLp}%</td>
                  <td style={{ color: pLp > 50 ? '#dc2626' : '#16a34a' }}>{pLp}%</td>
                  <td style={{ color: kHp > 30 ? '#16a34a' : '#d97706' }}>{kHp}%</td>
                  <td style={{ color: ocLp > 50 ? '#dc2626' : '#16a34a' }}>{ocLp}%</td>
                </tr>);
              })}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}

// ═══ ADMIN DASHBOARD ═══
function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null); const [users, setUsers] = useState([]);
  const [models, setModels] = useState(null); const [yieldModels, setYieldModels] = useState(null);
  const [srikakulam, setSrikakulam] = useState(null); const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats().catch(() => null), getAdminUsers().catch(() => []), getModelComparison().catch(() => null), getYieldComparison().catch(() => null), getSrikakulamAnalysis().catch(() => null), getTrainingDetails().catch(() => null)])
      .then(([s, u, m, y, sr, t]) => { setStats(s); setUsers(u); setModels(m); setYieldModels(y); setSrikakulam(sr); setTraining(t); setLoading(false); });
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading admin panel...</p></div>;

  return (
    <div className="app-shell">
      <header className="app-header"><div className="logo">QuantumSoil <span className="admin-badge">Admin</span></div>
        <div className="user-area" style={{ marginLeft: 'auto' }}><span className="user-badge" style={{ background: '#2563eb' }}>A</span><span className="user-name">{user.name || user.username || 'Admin'}</span><button className="btn-logout" onClick={onLogout}>Logout</button></div></header>
      <nav className="tab-nav">
        {[{ key: 'overview', label: 'Overview' }, { key: 'models', label: 'Model Accuracies' }, { key: 'srikakulam', label: 'Srikakulam' }, { key: 'users', label: 'Users' }].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </nav>
      <main className="main">
        {tab === 'overview' && <div className="tab-content animate-in"><div className="section-card"><h2>System Overview</h2>
          {stats && <div className="stats-grid"><div className="stat-card"><span className="stat-num">{stats.total_users || 0}</span><span className="stat-label">Users</span></div>
            <div className="stat-card"><span className="stat-num">{stats.total_predictions || 0}</span><span className="stat-label">Predictions</span></div>
            <div className="stat-card"><span className="stat-num">{stats.total_models || 69}</span><span className="stat-label">Models</span></div>
            <div className="stat-card"><span className="stat-num">{stats.farmers || 0}</span><span className="stat-label">Farmers</span></div></div>}</div>
          {training && <div className="section-card"><h3>Training Details</h3><div className="stats-grid">
            <div className="stat-card"><span className="stat-label">Dataset</span><span className="stat-num" style={{fontSize:'0.9rem'}}>{training.dataset || 'Crop_recommendation.csv'}</span></div>
            <div className="stat-card"><span className="stat-label">Samples</span><span className="stat-num">{training.total_samples || 2200}</span></div>
            <div className="stat-card"><span className="stat-label">Features</span><span className="stat-num">{training.n_features || 7}</span></div>
            <div className="stat-card"><span className="stat-label">Classes</span><span className="stat-num">{training.n_classes || 22}</span></div></div></div>}</div>}
        {tab === 'models' && <div className="tab-content animate-in">
          {models && <div className="section-card"><h3>Crop Recommendation Models (21)</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Model</th><th>Accuracy</th><th>F1 Score</th></tr></thead>
            <tbody>{Object.entries(models).sort((a,b) => (b[1].accuracy||0)-(a[1].accuracy||0)).map(([n,m]) => (<tr key={n}><td><strong>{n.replace(/_/g,' ')}</strong></td><td style={{color:(m.accuracy||0)>0.99?'#16a34a':'#d97706'}}>{((m.accuracy||0)*100).toFixed(2)}%</td><td>{((m.f1_score||m.f1||0)*100).toFixed(2)}%</td></tr>))}</tbody></table></div></div>}
          {yieldModels && <div className="section-card"><h3>Yield Prediction Models (18)</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Model</th><th>R2</th><th>MAE</th><th>RMSE</th></tr></thead>
            <tbody>{Object.entries(yieldModels.models||yieldModels).sort((a,b)=>(b[1].r2_score||0)-(a[1].r2_score||0)).map(([n,m])=>(<tr key={n}><td><strong>{n.replace(/_/g,' ')}</strong></td><td style={{color:(m.r2_score||0)>0.99?'#16a34a':'#d97706'}}>{((m.r2_score||0)*100).toFixed(2)}%</td><td>{(m.mae||0).toFixed(4)}</td><td>{(m.rmse||0).toFixed(4)}</td></tr>))}</tbody></table></div></div>}</div>}
        {tab === 'srikakulam' && <div className="tab-content animate-in">
          {srikakulam ? (<>{srikakulam.macro_models && <div className="section-card"><h3>Macro Nutrient Models (15)</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Model</th><th>Accuracy</th><th>F1</th></tr></thead>
            <tbody>{Object.entries(srikakulam.macro_models).sort((a,b)=>b[1].accuracy-a[1].accuracy).map(([n,m])=>(<tr key={n}><td><strong>{n.replace(/_/g,' ')}</strong></td><td style={{color:m.accuracy>0.85?'#16a34a':'#d97706'}}>{(m.accuracy*100).toFixed(2)}%</td><td>{(m.f1_score*100).toFixed(2)}%</td></tr>))}</tbody></table></div></div>}
            {srikakulam.micro_models && <div className="section-card"><h3>Micro Nutrient Models (15)</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Model</th><th>Accuracy</th><th>F1</th></tr></thead>
            <tbody>{Object.entries(srikakulam.micro_models).sort((a,b)=>b[1].accuracy-a[1].accuracy).map(([n,m])=>(<tr key={n}><td><strong>{n.replace(/_/g,' ')}</strong></td><td style={{color:'#16a34a'}}>{(m.accuracy*100).toFixed(2)}%</td><td>{(m.f1_score*100).toFixed(2)}%</td></tr>))}</tbody></table></div></div>}
            {srikakulam.macro_blocks && <div className="section-card"><h3>Block-wise Analysis (30 Blocks)</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Block</th><th>Samples</th><th>N Low%</th><th>P Low%</th><th>K High%</th><th>OC Low%</th></tr></thead>
            <tbody>{srikakulam.macro_blocks.map(b=>(<tr key={b.block}><td><strong>{b.block}</strong></td><td>{b.total_samples}</td><td style={{color:b.N.low_pct>80?'#dc2626':'#16a34a'}}>{b.N.low_pct}%</td><td style={{color:b.P.low_pct>50?'#dc2626':'#16a34a'}}>{b.P.low_pct}%</td><td style={{color:b.K.high_pct>30?'#16a34a':'#d97706'}}>{b.K.high_pct}%</td><td style={{color:b.OC.low_pct>50?'#dc2626':'#16a34a'}}>{b.OC.low_pct}%</td></tr>))}</tbody></table></div></div>}
          </>) : <div className="section-card"><p>Srikakulam data not available.</p></div>}</div>}
        {tab === 'users' && <div className="tab-content animate-in"><div className="section-card"><h3>Registered Users ({users.length})</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Predictions</th><th>Joined</th></tr></thead>
          <tbody>{users.map(u=>(<tr key={u.id}><td>{u.id}</td><td><strong>{u.name||u.first_name||'—'}</strong></td><td>{u.email}</td><td><span className={`role-badge ${u.role}`}>{u.role}</span></td><td>{u.phone||'—'}</td><td>{u.predictions||0}</td><td>{u.joined||u.date_joined||'—'}</td></tr>))}</tbody></table></div></div></div>}
      </main>
      <footer className="app-footer"><p>QuantumSoil Admin Panel</p></footer>
    </div>
  );
}
