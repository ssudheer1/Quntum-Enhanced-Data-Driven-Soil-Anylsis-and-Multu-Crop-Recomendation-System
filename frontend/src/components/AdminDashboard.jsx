import { useState, useEffect } from 'react';
import { getAdminStats, getAdminUsers, getTrainingDetails, getModelComparison } from '../services/api';

const MODEL_LABELS = {
  stacked_ensemble: 'Stacked Ensemble',
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
  knn: 'K-Nearest Neighbors',
  decision_tree: 'Decision Tree',
  extra_trees: 'Extra Trees',
  gradient_boosting: 'Gradient Boosting',
  adaboost: 'AdaBoost',
  svm: 'SVM (RBF Kernel)',
  logistic_regression: 'Logistic Regression',
  naive_bayes: 'Gaussian Naive Bayes',
  hist_gradient_boosting: 'Hist Gradient Boosting',
  bagging_classifier: 'Bagging Classifier',
  mlp: 'MLP Neural Network',
  deep_mlp: 'Deep MLP',
  lstm_tabular: 'LSTM-Tabular',
  mlp_lstm_hybrid: 'MLP+LSTM Hybrid',
  voting_ensemble: 'Voting Ensemble',
  quantum_ml: 'Quantum Hybrid SVM',
  quantum_random_forest: 'Quantum Random Forest',
};

const MODEL_COLORS = {
  stacked_ensemble: '#16a34a',
  random_forest: '#2563eb',
  xgboost: '#ea580c',
  lightgbm: '#7c3aed',
  knn: '#0891b2',
  decision_tree: '#65a30d',
  extra_trees: '#059669',
  gradient_boosting: '#d97706',
  adaboost: '#dc2626',
  svm: '#7c3aed',
  logistic_regression: '#2563eb',
  naive_bayes: '#0d9488',
  hist_gradient_boosting: '#4f46e5',
  bagging_classifier: '#0284c7',
  mlp: '#c026d3',
  deep_mlp: '#9333ea',
  lstm_tabular: '#e11d48',
  mlp_lstm_hybrid: '#be123c',
  voting_ensemble: '#15803d',
  quantum_ml: '#dc2626',
  quantum_random_forest: '#b91c1c',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [training, setTraining] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminStats().catch(() => null),
      getAdminUsers().catch(() => []),
      getTrainingDetails().catch(() => null),
      getModelComparison().catch(() => null),
    ]).then(([s, u, t, c]) => {
      setStats(s);
      setUsers(u);
      setTraining(t);
      setComparison(c);
      setLoading(false);
    });
  }, []);

  const TABS = [
    { key: 'overview', label: '📊 Overview', icon: '📊' },
    { key: 'models', label: '🤖 Model Accuracies', icon: '🤖' },
    { key: 'training', label: '⚙️ Training Details', icon: '⚙️' },
    { key: 'users', label: '👥 User Management', icon: '👥' },
  ];

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Admin Tabs */}
      <nav className="admin-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="admin-content">
        {activeTab === 'overview' && <OverviewTab stats={stats} comparison={comparison} />}
        {activeTab === 'models' && <ModelsTab comparison={comparison} training={training} />}
        {activeTab === 'training' && <TrainingTab training={training} />}
        {activeTab === 'users' && <UsersTab users={users} />}
      </div>
    </div>
  );
}

/* ── OVERVIEW TAB ── */
function OverviewTab({ stats, comparison }) {
  const cards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: '#2563eb' },
    { label: 'Farmers', value: stats?.total_farmers || 0, icon: '🌾', color: '#16a34a' },
    { label: 'Predictions Made', value: stats?.total_predictions || 0, icon: '🔬', color: '#7c3aed' },
    { label: 'Models Loaded', value: stats?.models_loaded ? 'Yes' : 'No', icon: '🤖', color: '#ea580c' },
  ];

  const bestModel = comparison?.comparison
    ? Object.entries(comparison.comparison).sort((a, b) => b[1].accuracy - a[1].accuracy)[0]
    : null;

  return (
    <div className="admin-overview">
      {/* Stat Cards */}
      <div className="admin-stat-grid">
        {cards.map((card, i) => (
          <div className="admin-stat-card" key={i} style={{ '--accent': card.color }}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Best Model Highlight */}
      {bestModel && (
        <div className="admin-highlight-card">
          <h3>🏆 Best Performing Model</h3>
          <div className="highlight-row">
            <span className="highlight-name">{MODEL_LABELS[bestModel[0]] || bestModel[0]}</span>
            <span className="highlight-value">{(bestModel[1].accuracy * 100).toFixed(2)}%</span>
          </div>
          <p>F1-Score: {(bestModel[1].f1_score * 100).toFixed(2)}% | Precision: {(bestModel[1].precision * 100).toFixed(2)}%</p>
        </div>
      )}

      {/* Recent Predictions */}
      {stats?.recent_predictions?.length > 0 && (
        <div className="admin-section-card">
          <h3>📋 Recent Predictions</h3>
          <table className="admin-table">
            <thead>
              <tr><th>Crop</th><th>Confidence</th><th>User</th><th>Date</th></tr>
            </thead>
            <tbody>
              {stats.recent_predictions.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.crop}</strong></td>
                  <td>{(p.confidence * 100).toFixed(1)}%</td>
                  <td>{p.user}</td>
                  <td>{new Date(p.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── MODELS TAB ── */
function ModelsTab({ comparison, training }) {
  const models = comparison?.comparison || {};
  const sorted = Object.entries(models).sort((a, b) => b[1].accuracy - a[1].accuracy);
  const maxAcc = sorted.length ? sorted[0][1].accuracy : 1;

  return (
    <div className="admin-models">
      {/* Accuracy Bar Chart */}
      <div className="admin-section-card">
        <h3>📊 Model Accuracy Comparison</h3>
        <div className="accuracy-chart">
          {sorted.map(([name, metrics]) => (
            <div className="accuracy-row" key={name}>
              <div className="accuracy-label">{MODEL_LABELS[name] || name}</div>
              <div className="accuracy-bar-wrap">
                <div
                  className="accuracy-bar-fill"
                  style={{
                    width: `${(metrics.accuracy / maxAcc) * 100}%`,
                    backgroundColor: MODEL_COLORS[name] || '#6b7280',
                  }}
                >
                  {(metrics.accuracy * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="admin-section-card">
        <h3>📋 Detailed Metrics</h3>
        <table className="admin-table metrics-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Accuracy</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1-Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([name, m]) => (
              <tr key={name} className={name === 'stacked_ensemble' ? 'best-row' : ''}>
                <td>
                  <span className="model-dot" style={{ backgroundColor: MODEL_COLORS[name] || '#6b7280' }}></span>
                  {MODEL_LABELS[name] || name}
                </td>
                <td><strong>{(m.accuracy * 100).toFixed(2)}%</strong></td>
                <td>{(m.precision * 100).toFixed(2)}%</td>
                <td>{(m.recall * 100).toFixed(2)}%</td>
                <td>{(m.f1_score * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quantum Details */}
      {comparison?.quantum_results && (
        <div className="admin-section-card quantum-card">
          <h3>⚛️ Quantum Model Details</h3>
          <div className="quantum-grid">
            <div className="q-item"><span>Architecture</span><strong>{comparison.quantum_results.architecture || 'Quantum Kernel SVM'}</strong></div>
            <div className="q-item"><span>Qubits</span><strong>{comparison.quantum_results.n_qubits}</strong></div>
            <div className="q-item"><span>Layers</span><strong>{comparison.quantum_results.n_layers}</strong></div>
            <div className="q-item"><span>Train Samples</span><strong>{comparison.quantum_results.n_train_samples}</strong></div>
            <div className="q-item"><span>Test Samples</span><strong>{comparison.quantum_results.n_test_samples}</strong></div>
            <div className="q-item"><span>Quantum Features</span><strong>{comparison.quantum_results.quantum_features || 16}</strong></div>
            <div className="q-item"><span>Total Features</span><strong>{comparison.quantum_results.total_features || 23}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TRAINING TAB ── */
function TrainingTab({ training }) {
  if (!training) {
    return <div className="admin-section-card"><p>Training details not available.</p></div>;
  }

  const ds = training.dataset_info || {};
  const det = training.training_details || {};

  return (
    <div className="admin-training">
      {/* Dataset Info */}
      <div className="admin-section-card">
        <h3>📂 Dataset Information</h3>
        <div className="dataset-grid">
          <div className="ds-item"><span>Total Samples</span><strong>{ds.total_samples || 2200}</strong></div>
          <div className="ds-item"><span>Train / Test Split</span><strong>{ds.train_samples || 1760} / {ds.test_samples || 440}</strong></div>
          <div className="ds-item"><span>Features</span><strong>{ds.n_features || 7}</strong></div>
          <div className="ds-item"><span>Classes (Crops)</span><strong>{ds.n_classes || 22}</strong></div>
        </div>
        {ds.features && (
          <div className="feature-chips">
            {ds.features.map(f => <span key={f} className="feature-chip">{f}</span>)}
          </div>
        )}
      </div>

      {/* Training Time */}
      {det.training_time > 0 && (
        <div className="admin-section-card">
          <h3>⏱️ Training Performance</h3>
          <p className="training-time">Total training time: <strong>{det.training_time}s</strong></p>
        </div>
      )}

      {/* Pipeline Steps */}
      <div className="admin-section-card">
        <h3>🔧 Pipeline Architecture</h3>
        <div className="pipeline-steps">
          {['Data Preprocessing', 'Hyperparameter Optimization (Optuna)', 'Classical Models Training (RF, XGBoost, LightGBM, KNN)', 'Extended Models Training (14 models)', 'Stacked Ensemble + Voting Ensemble', 'Quantum Hybrid SVM (PennyLane)', 'Quantum Random Forest (PennyLane)', 'SHAP Explainability'].map((step, i) => (
            <div className="pipeline-step" key={i}>
              <div className="step-number">{i + 1}</div>
              <div className="step-name">{step}</div>
              <div className="step-check">✓</div>
            </div>
          ))}
        </div>
      </div>

      {/* HPO Summary */}
      {det.hpo && Object.keys(det.hpo).length > 0 && (
        <div className="admin-section-card">
          <h3>🎯 Hyperparameter Optimization</h3>
          <p>Optimized using Optuna with Bayesian search across all models.</p>
          <div className="hpo-models">
            {Object.entries(det.hpo).map(([name, info]) => (
              <div className="hpo-card" key={name}>
                <strong>{MODEL_LABELS[name] || name}</strong>
                {info.best_score && <span>Best CV: {(info.best_score * 100).toFixed(1)}%</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── USERS TAB ── */
function UsersTab({ users }) {
  return (
    <div className="admin-users-tab">
      <div className="admin-section-card">
        <h3>👥 Registered Users ({users.length})</h3>
        <table className="admin-table users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Predictions</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.is_admin ? 'admin-row' : ''}>
                <td>{u.id}</td>
                <td><strong>{u.first_name} {u.last_name}</strong></td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge ${u.is_admin ? 'admin' : 'farmer'}`}>
                    {u.is_admin ? '🛡️ Admin' : '🌾 Farmer'}
                  </span>
                </td>
                <td>{u.phone || '—'}</td>
                <td>{u.predictions}</td>
                <td>{new Date(u.joined).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
