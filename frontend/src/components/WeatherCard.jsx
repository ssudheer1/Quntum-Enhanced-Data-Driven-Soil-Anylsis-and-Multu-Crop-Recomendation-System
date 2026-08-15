import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/i18n';
import { getWeather } from '../services/api';

export default function WeatherCard() {
  const { t } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState(18.30);
  const [lon, setLon] = useState(83.90);

  useEffect(() => { fetchWeather(); }, []);

  async function fetchWeather() {
    setLoading(true);
    try {
      const data = await getWeather(lat, lon);
      setWeather(data);
    } catch {
      // API might not be running
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card weather-card">
      <h3>
        🌤️ {t('liveWeather')}
        {weather && (
          <span className={`weather-badge ${weather.source === 'open-meteo' ? 'live' : 'fallback'}`}>
            {weather.source === 'open-meteo' ? `✓ ${t('live')}` : t('fallback')}
          </span>
        )}
      </h3>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--primary)' }}></div>
          <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('fetchingWeather')}</p>
        </div>
      )}

      {weather && !loading && (
        <div className="weather-grid">
          <div className="weather-item">
            <span className="weather-label">🌡️ {t('temperature')}</span>
            <span className="weather-value">{weather.temperature}°C</span>
          </div>
          <div className="weather-item">
            <span className="weather-label">💧 {t('humidity')}</span>
            <span className="weather-value">{weather.humidity}%</span>
          </div>
          <div className="weather-item">
            <span className="weather-label">🌧️ {t('rainfall')}</span>
            <span className="weather-value">{weather.rainfall} mm</span>
          </div>
          <div className="weather-item">
            <span className="weather-label">📍 Location</span>
            <span className="weather-value" style={{ fontSize: '0.85rem' }}>
              {weather.latitude?.toFixed(1)}°N, {weather.longitude?.toFixed(1)}°E
            </span>
          </div>
        </div>
      )}

      {!weather && !loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '16px' }}>
          Start the Django server to fetch live weather
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <input className="input-field" type="number" value={lat}
          onChange={e => setLat(parseFloat(e.target.value))} placeholder="Lat" step="0.01" style={{ flex: 1 }} />
        <input className="input-field" type="number" value={lon}
          onChange={e => setLon(parseFloat(e.target.value))} placeholder="Lon" step="0.01" style={{ flex: 1 }} />
        <button className="btn-secondary" onClick={fetchWeather} style={{ padding: '10px 14px' }}>🔄</button>
      </div>
    </div>
  );
}
