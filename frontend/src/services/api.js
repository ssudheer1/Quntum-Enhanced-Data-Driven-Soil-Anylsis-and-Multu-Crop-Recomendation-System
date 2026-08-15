/**
 * API Service — Communicates with the Django backend
 */

import { getToken } from './authService';

const API_BASE = 'http://localhost:8000/api';

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h['Authorization'] = `Token ${token}`;
  return h;
}

/** Make a crop prediction (stacked ensemble) */
export async function predictCrop(inputData) {
  const response = await fetch(`${API_BASE}/predict/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(inputData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Prediction failed');
  }
  return response.json();
}

/** Predict with a specific model */
export async function predictWithModel(modelName, inputData) {
  const response = await fetch(`${API_BASE}/predict/${modelName}/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(inputData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Prediction failed');
  }
  return response.json();
}

/** Trigger model training */
export async function trainModels(options = {}) {
  const response = await fetch(`${API_BASE}/train/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(options),
  });
  return response.json();
}

/** Get model comparison data */
export async function getModelComparison() {
  const response = await fetch(`${API_BASE}/model-comparison/`, { headers: headers() });
  if (!response.ok) throw new Error('Models not trained yet');
  return response.json();
}

/** Get weather data for coordinates */
export async function getWeather(latitude = 18.30, longitude = 83.90) {
  const response = await fetch(
    `${API_BASE}/weather/?latitude=${latitude}&longitude=${longitude}`,
    { headers: headers() }
  );
  return response.json();
}

/** Health check */
export async function healthCheck() {
  const response = await fetch(`${API_BASE}/health/`);
  return response.json();
}

/** Get prediction history */
export async function getHistory(limit = 10) {
  const response = await fetch(`${API_BASE}/history/?limit=${limit}`, { headers: headers() });
  return response.json();
}

// ── Admin APIs ──

/** Get admin dashboard stats */
export async function getAdminStats() {
  const response = await fetch(`${API_BASE}/admin/stats/`, { headers: headers() });
  return response.json();
}

/** Get all registered users (admin) */
export async function getAdminUsers() {
  const response = await fetch(`${API_BASE}/admin/users/`, { headers: headers() });
  return response.json();
}

/** Get full training details (admin) */
export async function getTrainingDetails() {
  const response = await fetch(`${API_BASE}/admin/training-details/`, { headers: headers() });
  if (!response.ok) throw new Error('Training details not available');
  return response.json();
}
