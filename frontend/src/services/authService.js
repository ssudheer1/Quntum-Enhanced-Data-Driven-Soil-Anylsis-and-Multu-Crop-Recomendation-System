/**
 * Auth Service — Email OTP-based Authentication
 * Handles signup, login, OTP verification, token & role management
 */

const API_BASE = 'http://localhost:8000/api';

// ── Token & User Management ──

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function getUser() {
  const data = localStorage.getItem('auth_user');
  return data ? JSON.parse(data) : null;
}

export function getUserRole() {
  const user = getUser();
  return user?.role || 'farmer';
}

export function isAdmin() {
  return getUserRole() === 'admin';
}

export function isAuthenticated() {
  return !!getToken();
}

function saveAuth(token, user) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

// ── Signup Flow ──

export async function signupSendOTP(email, firstName, lastName) {
  const res = await fetch(`${API_BASE}/signup/send-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
  return data;
}

export async function signupVerifyOTP({ email, otp, firstName, lastName, phone, password, preferredLanguage }) {
  const res = await fetch(`${API_BASE}/signup/verify-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, otp,
      first_name: firstName,
      last_name: lastName,
      phone,
      password,
      preferred_language: preferredLanguage || 'en',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup verification failed');
  saveAuth(data.token, data.user);
  return data;
}

// ── Login Flow ──

export async function loginSendOTP(email) {
  const res = await fetch(`${API_BASE}/login/send-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
  return data;
}

export async function loginVerifyOTP(email, otp) {
  const res = await fetch(`${API_BASE}/login/verify-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login verification failed');
  saveAuth(data.token, data.user);
  return data;
}

// ── Password Login (fallback / admin) ──

export async function loginWithPassword(username, password) {
  const res = await fetch(`${API_BASE}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  saveAuth(data.token, data.user);
  return data;
}
