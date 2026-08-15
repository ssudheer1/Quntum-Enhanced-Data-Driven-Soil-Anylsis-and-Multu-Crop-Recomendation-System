import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/i18n';
import { getModelComparison } from '../services/api';

const MODEL_CONFIG = {
  adaboost:               { icon: '🎯', color: '#dc2626', label: 'AdaBoost' },
  quantum_random_forest:  { icon: '🔮', color: '#b91c1c', label: 'Quantum Random Forest' },
  random_forest:          { icon: '🌲', color: '#16a34a', label: 'Random Forest' },
  extra_trees:            { icon: '🌳', color: '#059669', label: 'Extra Trees' },
  naive_bayes:            { icon: '📐', color: '#0d9488', label: 'Gaussian Naive Bayes' },
  voting_ensemble:        { icon: '🗳️', color: '#15803d', label: 'Voting Ensemble' },
  stacked_ensemble:       { icon: '🏗️', color: '#db2777', label: 'Stacked Ensemble' },
  bagging_classifier:     { icon: '🎒', color: '#0284c7', label: 'Bagging Classifier' },
  deep_mlp:               { icon: '🧠', color: '#9333ea', label: 'Deep MLP' },
  mlp_lstm_hybrid:        { icon: '🔗', color: '#be123c', label: 'MLP+LSTM Hybrid' },
  xgboost:                { icon: '🚀', color: '#0891b2', label: 'XGBoost' },
  gradient_boosting:      { icon: '📈', color: '#d97706', label: 'Gradient Boosting' },
  lightgbm:               { icon: '⚡', color: '#ca8a04', label: 'LightGBM' },
  svm:                    { icon: '🎯', color: '#7c3aed', label: 'SVM (RBF Kernel)' },
  hist_gradient_boosting: { icon: '📊', color: '#4f46e5', label: 'Hist Gradient Boosting' },
  mlp:                    { icon: '🔬', color: '#c026d3', label: 'MLP Neural Network' },
  knn:                    { icon: '📍', color: '#7c3aed', label: 'K-Nearest Neighbors' },
  decision_tree:          { icon: '🌿', color: '#65a30d', label: 'Decision Tree' },
  logistic_regression:    { icon: '📉', color: '#2563eb', label: 'Logistic Regression' },
  lstm_tabular:           { icon: '🔄', color: '#e11d48', label: 'LSTM-Tabular' },
  quantum_ml:             { icon: '⚛️', color: '#92400e', label: 'Quantum Hybrid SVM' },
};

export default function ModelComparison() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const result = await getModelComparison();
      setData(result);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--primary)' }}></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading model data...</p>
      </div>
    );
  }

  if (!data || !data.comparison) {
    return (
      <div className="glass-card no-data animate-fade-in-up">
        <div className="no-data-icon">🧠</div>
        <h3>{t('noModelData')}</h3>
        <p>{t('modelsNotTrained')}</p>
        <button className="btn-primary" style={{ marginTop: '16px' }} onClick={fetchData}>🔄 {t('refresh')}</button>
      </div>
    );
  }

  const { comparison, quantum_results } = data;

  // Sort by accuracy descending
  const sorted = Object.entries(comparison).sort((a, b) => b[1].accuracy - a[1].accuracy);

  // Find best model
  const bestModel = sorted.length ? sorted[0][0] : '';

  return (
    <div className="comparison-section animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🏆 {t('modelPerformance')} ({sorted.length} Models)</h2>
        <button className="btn-secondary" onClick={fetchData}>🔄 {t('refresh')}</button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>{t('accuracy')}</th>
                <th>{t('precision')}</th>
                <th>{t('recall')}</th>
                <th>{t('f1Score')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(([name, metrics]) => {
                const cfg = MODEL_CONFIG[name] || { icon: '📊', color: '#64748b', label: name };
                const isBest = name === bestModel;
                return (
                  <tr key={name}>
                    <td>
                      <div className="model-name-cell">
                        <div className="model-icon" style={{ background: `${cfg.color}15`, color: cfg.color }}>{cfg.icon}</div>
                        {cfg.label}
                        {isBest && <span className="best-badge">⭐ {t('best')}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="accuracy-cell" style={{ color: cfg.color }}>
                        {(metrics.accuracy * 100).toFixed(2)}%
                        <div className="accuracy-bar">
                          <div className="accuracy-bar-fill" style={{ width: `${metrics.accuracy * 100}%`, background: cfg.color }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="metric-cell">{(metrics.precision * 100).toFixed(2)}%</td>
                    <td className="metric-cell">{(metrics.recall * 100).toFixed(2)}%</td>
                    <td className="metric-cell">{(metrics.f1_score * 100).toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quantum Details */}
      {quantum_results && quantum_results.n_qubits && (
        <div className="glass-card quantum-details-card">
          <h3 style={{ fontSize: '1rem', color: 'var(--brown-700)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚛️ {t('quantumDetails')}
          </h3>
          <div className="quantum-stats-grid">
            <div className="quantum-stat">
              <div className="stat-label">{t('qubits')}</div>
              <div className="stat-value">{quantum_results.n_qubits}</div>
            </div>
            <div className="quantum-stat">
              <div className="stat-label">{t('layers')}</div>
              <div className="stat-value">{quantum_results.n_layers || 3}</div>
            </div>
            <div className="quantum-stat">
              <div className="stat-label">{t('trainSamples')}</div>
              <div className="stat-value">{quantum_results.n_train_samples || 150}</div>
            </div>
            <div className="quantum-stat">
              <div className="stat-label">{t('testSamples')}</div>
              <div className="stat-value">{quantum_results.n_test_samples || 30}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
