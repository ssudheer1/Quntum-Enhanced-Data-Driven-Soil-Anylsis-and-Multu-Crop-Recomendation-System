import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/i18n';

const DEFAULT_VALUES = {
  nitrogen: 90,
  phosphorus: 42,
  potassium: 43,
  temperature: 20.88,
  humidity: 82.0,
  ph: 6.5,
  rainfall: 202.94,
};

export default function InputForm({ onSubmit, loading, weatherData }) {
  const { t } = useLanguage();
  const [values, setValues] = useState(DEFAULT_VALUES);

  // Auto-fill weather data when it arrives
  useEffect(() => {
    if (weatherData) {
      setValues(prev => ({
        ...prev,
        temperature: weatherData.temperature || prev.temperature,
        humidity: weatherData.humidity || prev.humidity,
        rainfall: weatherData.rainfall || prev.rainfall,
      }));
    }
  }, [weatherData]);

  const FIELDS = [
    { key: 'nitrogen', label: t('nitrogen'), icon: '🧪', unit: 'mg/kg', min: 0, max: 300, step: 1 },
    { key: 'phosphorus', label: t('phosphorus'), icon: '🔬', unit: 'mg/kg', min: 0, max: 200, step: 1 },
    { key: 'potassium', label: t('potassium'), icon: '⚗️', unit: 'mg/kg', min: 0, max: 250, step: 1 },
    { key: 'ph', label: t('soilPH'), icon: '📐', unit: 'pH', min: 0, max: 14, step: 0.1 },
    { key: 'temperature', label: t('temperature'), icon: '🌡️', unit: '°C', min: -10, max: 60, step: 0.1 },
    { key: 'humidity', label: t('humidity'), icon: '💧', unit: '%', min: 0, max: 100, step: 0.1 },
    { key: 'rainfall', label: t('rainfall'), icon: '🌧️', unit: 'mm', min: 0, max: 500, step: 0.1 },
  ];

  function handleChange(key, val) {
    setValues(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  function handleReset() {
    setValues(DEFAULT_VALUES);
  }

  return (
    <form className="glass-card input-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>🌾 {t('soilParams')}</h2>
        <p>{t('soilParamsSubtitle')}</p>
      </div>

      <div className="form-grid">
        {FIELDS.map(field => (
          <div className="form-group" key={field.key}>
            <label htmlFor={`input-${field.key}`}>
              <span className="label-icon">{field.icon}</span>
              {field.label} ({field.unit})
            </label>
            <input
              id={`input-${field.key}`}
              className="input-field"
              type="number"
              value={values[field.key]}
              onChange={e => handleChange(field.key, e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={`${field.min} - ${field.max}`}
              required
            />
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <><span className="spinner"></span> {t('analyzing')}</>
          ) : (
            <>🚀 {t('analyzePredict')}</>
          )}
        </button>
        <button type="button" className="btn-secondary" onClick={handleReset}>
          ↺ {t('reset')}
        </button>
      </div>
    </form>
  );
}
