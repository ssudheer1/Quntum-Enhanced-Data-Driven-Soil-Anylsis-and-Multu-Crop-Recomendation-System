const API = 'http://localhost:8000/api';

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('qs_token');
  if (token) h['Authorization'] = `Token ${token}`;
  return h;
}

// Auth
export async function signupSendOTP(email, name, phone) {
  const r = await fetch(`${API}/signup/send-otp/`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, name, phone }) });
  return r.json();
}
export async function signupVerifyOTP(email, otp) {
  const r = await fetch(`${API}/signup/verify-otp/`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, otp }) });
  const data = await r.json();
  if (data.token) { localStorage.setItem('qs_token', data.token); localStorage.setItem('qs_user', JSON.stringify(data.user || {})); }
  return data;
}
export async function loginSendOTP(email) {
  const r = await fetch(`${API}/login/send-otp/`, { method: 'POST', headers: headers(), body: JSON.stringify({ email }) });
  return r.json();
}
export async function loginVerifyOTP(email, otp) {
  const r = await fetch(`${API}/login/verify-otp/`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, otp }) });
  const data = await r.json();
  if (data.token) { localStorage.setItem('qs_token', data.token); localStorage.setItem('qs_user', JSON.stringify(data.user || {})); }
  return data;
}
export async function registerPassword(username, email, password, firstName, phone) {
  const r = await fetch(`${API}/register/`, { method: 'POST', headers: headers(), body: JSON.stringify({ username, email, password, first_name: firstName, phone }) });
  const data = await r.json();
  if (data.token) { localStorage.setItem('qs_token', data.token); localStorage.setItem('qs_user', JSON.stringify(data.user || {})); }
  return data;
}
export async function loginPassword(username, password) {
  const r = await fetch(`${API}/login/`, { method: 'POST', headers: headers(), body: JSON.stringify({ username, password }) });
  const data = await r.json();
  if (data.token) { localStorage.setItem('qs_token', data.token); localStorage.setItem('qs_user', JSON.stringify(data.user || {})); }
  return data;
}
export function logout() { localStorage.removeItem('qs_token'); localStorage.removeItem('qs_user'); }
export function isLoggedIn() { return !!localStorage.getItem('qs_token'); }
export function getUser() { try { return JSON.parse(localStorage.getItem('qs_user') || '{}'); } catch { return {}; } }

// Admin
export async function getAdminStats() {
  const r = await fetch(`${API}/admin/stats/`, { headers: headers() });
  if (!r.ok) throw new Error('Failed'); return r.json();
}
export async function getAdminUsers() {
  const r = await fetch(`${API}/admin/users/`, { headers: headers() });
  if (!r.ok) throw new Error('Failed'); return r.json();
}
export async function getModelComparison() {
  const r = await fetch(`${API}/model-comparison/`, { headers: headers() });
  if (!r.ok) throw new Error('Failed'); return r.json();
}
export async function getTrainingDetails() {
  const r = await fetch(`${API}/admin/training-details/`, { headers: headers() });
  if (!r.ok) throw new Error('Failed'); return r.json();
}
export async function getYieldComparison() {
  const r = await fetch(`${API}/yield-comparison/`, { headers: headers() });
  if (!r.ok) throw new Error('Failed'); return r.json();
}
export async function getKFoldResults() {
  const r = await fetch(`${API}/kfold-results/`, { headers: headers() });
  if (!r.ok) throw new Error('Failed'); return r.json();
}

// Crop Recommendation
export async function predictCrop(data) {
  const r = await fetch(`${API}/predict/`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  if (!r.ok) throw new Error('Prediction failed');
  return r.json();
}

// Yield Prediction
export async function predictYield(data) {
  const r = await fetch(`${API}/predict-yield/`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  if (!r.ok) throw new Error('Yield prediction failed');
  return r.json();
}

// Weather
export async function getWeather(lat, lon) {
  const r = await fetch(`${API}/weather/?latitude=${lat}&longitude=${lon}`, { headers: headers() });
  if (!r.ok) throw new Error('Weather fetch failed');
  return r.json();
}

// Srikakulam Analysis
export async function getSrikakulamAnalysis() {
  const r = await fetch(`${API}/srikakulam-analysis/`, { headers: headers() });
  if (!r.ok) throw new Error('Srikakulam data not available');
  return r.json();
}

// Srikakulam Prediction
export async function predictSrikakulam(data) {
  const r = await fetch(`${API}/predict-srikakulam/`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  if (!r.ok) throw new Error('Prediction failed');
  return r.json();
}

// Agri Yield Prediction (46 features)
export async function predictAgriYield(data) {
  const r = await fetch(`${API}/predict-agri-yield/`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  if (!r.ok) throw new Error('Agri yield prediction failed');
  return r.json();
}

export async function getAgriYieldOptions() {
  const r = await fetch(`${API}/agri-yield-options/`, { headers: headers() });
  if (!r.ok) throw new Error('Options not available');
  return r.json();
}
