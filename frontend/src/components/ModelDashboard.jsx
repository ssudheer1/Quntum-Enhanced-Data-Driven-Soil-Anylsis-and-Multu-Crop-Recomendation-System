import { useState } from 'react';
import { useLanguage } from '../i18n/i18n';
import { predictWithModel } from '../services/api';

const MODELS = [
  { key: 'adaboost', icon: '🎯', color: '#dc2626', label: 'AdaBoost', desc: 'Adaptive boosting with decision tree base estimators' },
  { key: 'quantum_random_forest', icon: '🔮', color: '#b91c1c', label: 'Quantum Random Forest', desc: 'PennyLane quantum circuit features + Random Forest hybrid' },
  { key: 'random_forest', icon: '🌲', color: '#16a34a', label: 'Random Forest', desc: 'Ensemble of decision trees using bagging' },
  { key: 'extra_trees', icon: '🌳', color: '#059669', label: 'Extra Trees', desc: 'Extremely randomized trees ensemble' },
  { key: 'naive_bayes', icon: '📐', color: '#0d9488', label: 'Gaussian Naive Bayes', desc: 'Probabilistic classifier using Bayes theorem' },
  { key: 'voting_ensemble', icon: '🗳️', color: '#15803d', label: 'Voting Ensemble', desc: 'Soft voting of top models for consensus' },
  { key: 'stacked_ensemble', icon: '🏗️', color: '#db2777', label: 'Stacked Ensemble', desc: 'Meta-learner combining all base models' },
  { key: 'bagging_classifier', icon: '🎒', color: '#0284c7', label: 'Bagging Classifier', desc: 'Bootstrap aggregating with Extra Trees base' },
  { key: 'deep_mlp', icon: '🧠', color: '#9333ea', label: 'Deep MLP', desc: '5-layer neural network with adaptive learning' },
  { key: 'mlp_lstm_hybrid', icon: '🔗', color: '#be123c', label: 'MLP+LSTM Hybrid', desc: 'Neural network with augmented sequential features' },
  { key: 'xgboost', icon: '🚀', color: '#0891b2', label: 'XGBoost', desc: 'Extreme gradient boosting with regularization' },
  { key: 'gradient_boosting', icon: '📈', color: '#d97706', label: 'Gradient Boosting', desc: 'Sequential boosting with gradient descent' },
  { key: 'lightgbm', icon: '⚡', color: '#ca8a04', label: 'LightGBM', desc: 'Fast gradient boosting with leaf-wise growth' },
  { key: 'svm', icon: '🎯', color: '#7c3aed', label: 'SVM (RBF)', desc: 'Support vector machine with radial basis kernel' },
  { key: 'hist_gradient_boosting', icon: '📊', color: '#4f46e5', label: 'Hist Gradient Boosting', desc: 'Histogram-based gradient boosting classifier' },
  { key: 'mlp', icon: '🔬', color: '#c026d3', label: 'MLP Neural Network', desc: '3-layer neural network with ReLU activation' },
  { key: 'knn', icon: '📍', color: '#7c3aed', label: 'KNN', desc: 'Instance-based learning using K nearest data points' },
  { key: 'decision_tree', icon: '🌿', color: '#65a30d', label: 'Decision Tree', desc: 'Single tree classifier with balanced weights' },
  { key: 'logistic_regression', icon: '📉', color: '#2563eb', label: 'Logistic Regression', desc: 'Multinomial logistic regression (L-BFGS)' },
  { key: 'lstm_tabular', icon: '🔄', color: '#e11d48', label: 'LSTM-Tabular', desc: 'Recurrent-style processing on tabular features' },
  { key: 'quantum_ml', icon: '⚛️', color: '#92400e', label: 'Quantum Hybrid SVM', desc: 'PennyLane quantum circuit features + SVM' },
];

const CROP_EMOJIS = {
  rice: '🌾', wheat: '🌾', maize: '🌽', chickpea: '🫘', kidneybeans: '🫘',
  pigeonpeas: '🫘', mothbeans: '🫘', mungbean: '🫘', blackgram: '🫘',
  lentil: '🫘', pomegranate: '🍎', banana: '🍌', mango: '🥭', grapes: '🍇',
  watermelon: '🍉', muskmelon: '🍈', apple: '🍎', orange: '🍊',
  papaya: '🫒', coconut: '🥥', cotton: '🌿', jute: '🌿', coffee: '☕',
};

const DEFAULT_INPUT = {
  nitrogen: 90, phosphorus: 42, potassium: 43,
  temperature: 20.88, humidity: 82.0, ph: 6.5, rainfall: 202.94,
};

export default function ModelDashboard({ comparisonData }) {
  const { t } = useLanguage();
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState({});
  const [input] = useState(DEFAULT_INPUT);

  async function runPrediction(modelKey) {
    setLoading(prev => ({ ...prev, [modelKey]: true }));
    try {
      const result = await predictWithModel(modelKey, input);
      setPredictions(prev => ({ ...prev, [modelKey]: result }));
    } catch (err) {
      setPredictions(prev => ({ ...prev, [modelKey]: { error: err.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [modelKey]: false }));
    }
  }

  async function runAllPredictions() {
    for (const model of MODELS) {
      await runPrediction(model.key);
    }
  }

  const comparison = comparisonData?.comparison || {};

  return (
    <div className="model-dashboards animate-fade-in-up">
      <div className="dash-header">
        <h2>🧠 {t('modelDashboards')} ({MODELS.length} Models)</h2>
        <button className="btn-primary" onClick={runAllPredictions}>
          🔄 Predict with All Models
        </button>
      </div>

      {/* Input Summary */}
      <div className="glass-card dash-input-summary">
        <h4>📋 Input Parameters (Default Sample)</h4>
        <div className="input-tags">
          {Object.entries(input).map(([key, val]) => (
            <span key={key} className="input-tag">
              {key}: <strong>{val}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* All Model Cards */}
      <div className="dash-grid">
        {MODELS.map(model => {
          const metrics = comparison[model.key] || {};
          const pred = predictions[model.key];
          const isLoading = loading[model.key];

          return (
            <div key={model.key} className="glass-card dash-model-card"
              style={{ '--model-color': model.color }}>
              <div className="dash-card-head">
                <div className="dash-model-icon" style={{ background: `${model.color}15`, color: model.color }}>
                  {model.icon}
                </div>
                <div>
                  <h3 className="dash-model-name">{model.label}</h3>
                  <p className="dash-model-desc">{model.desc}</p>
                </div>
              </div>

              {metrics.accuracy && (
                <div className="dash-metrics">
                  <div className="dash-metric">
                    <span className="dash-metric-label">{t('accuracy')}</span>
                    <span className="dash-metric-value" style={{ color: model.color }}>
                      {(metrics.accuracy * 100).toFixed(2)}%
                    </span>
                    <div className="dash-metric-bar">
                      <div style={{ width: `${metrics.accuracy * 100}%`, background: model.color }}></div>
                    </div>
                  </div>
                  <div className="dash-metric-row">
                    <div>
                      <span className="dash-metric-label">{t('precision')}</span>
                      <span className="dash-metric-sm">{(metrics.precision * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="dash-metric-label">{t('recall')}</span>
                      <span className="dash-metric-sm">{(metrics.recall * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="dash-metric-label">{t('f1Score')}</span>
                      <span className="dash-metric-sm">{(metrics.f1_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {pred && !pred.error && (
                <div className="dash-prediction">
                  <div className="dash-pred-crop">
                    <span className="dash-crop-emoji">{CROP_EMOJIS[pred.recommended_crop] || '🌱'}</span>
                    <div>
                      <span className="dash-crop-name">{pred.recommended_crop}</span>
                      <span className="dash-crop-conf">{(pred.confidence * 100).toFixed(1)}% confidence</span>
                    </div>
                  </div>
                  {pred.top_3_crops && (
                    <div className="dash-top3">
                      {pred.top_3_crops.map((c, i) => (
                        <span key={c.crop} className="dash-top3-item">
                          #{i + 1} {c.crop} ({(c.probability * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {pred?.error && <div className="dash-error">⚠️ {pred.error}</div>}

              <button className="btn-secondary dash-predict-btn"
                onClick={() => runPrediction(model.key)} disabled={isLoading}>
                {isLoading ? <span className="spinner" style={{borderTopColor: model.color}}></span> : model.icon}
                {' '}Predict with {model.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
