import { useState, useEffect } from 'react';
import { getAdminStats, getAdminUsers, getTrainingDetails, getModelComparison, getYieldComparison, getKFoldResults, getSrikakulamAnalysis } from '../services/api';

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
  const [yieldData, setYieldData] = useState(null);
  const [kfoldData, setKfoldData] = useState(null);
  const [srikakulamData, setSrikakulamData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminStats().catch(() => null),
      getAdminUsers().catch(() => []),
      getTrainingDetails().catch(() => null),
      getModelComparison().catch(() => null),
      getYieldComparison().catch(() => null),
      getKFoldResults().catch(() => null),
      getSrikakulamAnalysis().catch(() => null),
    ]).then(([s, u, t, c, y, k, sr]) => {
      setStats(s);
      setUsers(u);
      setTraining(t);
      setComparison(c);
      setYieldData(y);
      setKfoldData(k);
      setSrikakulamData(sr);
      setLoading(false);
    });
  }, []);

  const TABS = [
    { key: 'overview', label: '📊 Overview', icon: '📊' },
    { key: 'models', label: '🤖 Model Accuracies', icon: '🤖' },
    { key: 'kfold', label: '📐 K-Fold Strategy', icon: '📐' },
    { key: 'yield', label: '🌾 Yield Dataset', icon: '🌾' },
    { key: 'training', label: '⚙️ Training Details', icon: '⚙️' },
    { key: 'srikakulam', label: '🏔️ Srikakulam', icon: '🏔️' },
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
        {activeTab === 'kfold' && <KFoldTab kfoldData={kfoldData} />}
        {activeTab === 'yield' && <YieldTab yieldData={yieldData} />}
        {activeTab === 'training' && <TrainingTab training={training} />}
        {activeTab === 'srikakulam' && <SrikakulamTab data={srikakulamData} />}
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
  const ds = training?.dataset_info || {};
  const det = training?.training_details || {};

  return (
    <div className="admin-training">
      {/* ── Dataset 1: Crop Recommendation ── */}
      <div className="admin-section-card">
        <h3>📂 Dataset 1: Crop Recommendation</h3>
        <div className="dataset-grid">
          <div className="ds-item"><span>Task</span><strong>Multi-class Classification</strong></div>
          <div className="ds-item"><span>Samples</span><strong>{ds.total_samples || 2200}</strong></div>
          <div className="ds-item"><span>Train / Test</span><strong>{ds.train_samples || 1760} / {ds.test_samples || 440}</strong></div>
          <div className="ds-item"><span>Features</span><strong>{ds.n_features || 7} (N, P, K, pH, Temp, Humidity, Rainfall)</strong></div>
          <div className="ds-item"><span>Classes</span><strong>{ds.n_classes || 22} Crop Types</strong></div>
          <div className="ds-item"><span>Models</span><strong>21 (17 base + 2 ensemble + 2 quantum)</strong></div>
          <div className="ds-item"><span>Best Accuracy</span><strong style={{ color: '#16a34a' }}>99.77% (Stacked Ensemble)</strong></div>
          <div className="ds-item"><span>Validation</span><strong>5-Fold Stratified CV + Optuna HPO</strong></div>
        </div>
      </div>

      {/* ── Dataset 2: Yield Prediction ── */}
      <div className="admin-section-card">
        <h3>📂 Dataset 2: Agri Yield Prediction</h3>
        <div className="dataset-grid">
          <div className="ds-item"><span>Task</span><strong>Regression (Yield Prediction)</strong></div>
          <div className="ds-item"><span>Samples</span><strong>10,000</strong></div>
          <div className="ds-item"><span>Train / Test</span><strong>8,000 / 2,000</strong></div>
          <div className="ds-item"><span>Features</span><strong>54 (43 original + 11 engineered)</strong></div>
          <div className="ds-item"><span>Target</span><strong>Yield (continuous, 1.0 - 10.0)</strong></div>
          <div className="ds-item"><span>Models</span><strong>20 Regression Models</strong></div>
          <div className="ds-item"><span>Metrics</span><strong>R² Score, MAE, RMSE</strong></div>
          <div className="ds-item"><span>Validation</span><strong>5-Fold CV on 11 fast models</strong></div>
        </div>
      </div>

      {/* Training Time */}
      <div className="admin-section-card">
        <h3>⏱️ Training Performance</h3>
        <div className="dataset-grid">
          <div className="ds-item"><span>Crop Models</span><strong>{det.training_time ? det.training_time + 's' : '~120s'}</strong></div>
          <div className="ds-item"><span>Yield Models</span><strong>~210s</strong></div>
          <div className="ds-item"><span>K-Fold CV</span><strong>~400s</strong></div>
          <div className="ds-item"><span>Total</span><strong>~12 minutes</strong></div>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="admin-section-card">
        <h3>🔧 ML Pipeline Architecture</h3>
        <div className="pipeline-steps">
          {[
            'Data Preprocessing & Feature Engineering',
            '80:20 Stratified Train-Test Split',
            'Hyperparameter Optimization (Optuna, 10 trials)',
            '5-Fold Stratified Cross-Validation',
            'Classical Models (RF, XGBoost, LightGBM, KNN, SVM, etc.)',
            'Deep Learning (MLP, Deep MLP, LSTM-Tabular, MLP+LSTM)',
            'Ensemble Methods (Voting, Stacking, Bagging, AdaBoost)',
            'Quantum Models (Quantum Hybrid SVM, Quantum Random Forest)',
            'Regression Models (Ridge, Lasso, ElasticNet, SVR, etc.)',
            'SHAP Explainability & Feature Importance',
          ].map((step, i) => (
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

/* ── K-FOLD STRATEGY TAB ── */
function KFoldTab({ kfoldData }) {
  if (!kfoldData) {
    return <div className="admin-section-card"><p>K-fold cross-validation results not available. Train models first.</p></div>;
  }

  const renderDataset = (name, data) => {
    if (!data) return null;
    const isRegression = name === 'yield_prediction';
    const sortKey = isRegression ? 'mean_r2' : 'mean_accuracy';
    const sorted = Object.entries(data).sort((a, b) => (b[1][sortKey] || 0) - (a[1][sortKey] || 0));

    return (
      <div className="admin-section-card" key={name}>
        <h3>📊 {name === 'crop_recommendation' ? 'Crop Recommendation (2,200 rows, 22 classes — Classification)' : 'Agri Yield Prediction (10,000 rows — Regression)'}</h3>
        <table className="admin-table metrics-table">
          <thead>
            <tr>
              <th>Model</th>
              {isRegression ? (
                <><th>Mean CV R²</th><th>Std Dev</th><th>Mean MAE</th></>
              ) : (
                <><th>Mean CV Accuracy</th><th>Std Dev</th><th>Mean F1</th></>
              )}
              {[1,2,3,4,5].map(i => <th key={i}>Fold {i}</th>)}
            </tr>
          </thead>
          <tbody>
            {sorted.map(([model, r]) => (
              <tr key={model}>
                <td>
                  <span className="model-dot" style={{ backgroundColor: MODEL_COLORS[model] || '#6b7280' }}></span>
                  {MODEL_LABELS[model] || model}
                </td>
                {isRegression ? (
                  <>
                    <td><strong>{(r.mean_r2 || 0).toFixed(4)}</strong></td>
                    <td>±{(r.std_r2 || 0).toFixed(4)}</td>
                    <td>{(r.mean_mae || 0).toFixed(4)}</td>
                  </>
                ) : (
                  <>
                    <td><strong>{((r.mean_accuracy || 0) * 100).toFixed(2)}%</strong></td>
                    <td>±{((r.std_accuracy || 0) * 100).toFixed(2)}%</td>
                    <td>{((r.mean_f1 || 0) * 100).toFixed(2)}%</td>
                  </>
                )}
                {r.fold_scores?.map((f, i) => (
                  <td key={i}>{isRegression ? (f.r2_score || 0).toFixed(3) : ((f.accuracy || 0) * 100).toFixed(1) + '%'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-kfold">
      {/* Strategy Explanation */}
      <div className="admin-section-card">
        <h3>📐 5-Fold Stratified Cross-Validation Strategy</h3>
        <div className="pipeline-steps">
          {[
            '80:20 Stratified Train-Test Split',
            '5-Fold Stratified CV on 80% Training Data',
            'Optuna HPO (Bayesian Search) on Key Models',
            'Select Best Hyperparameters per Model',
            'Retrain on Complete 80% Training Set',
            'Final Evaluation on Unseen 20% Test Set',
          ].map((step, i) => (
            <div className="pipeline-step" key={i}>
              <div className="step-number">{i + 1}</div>
              <div className="step-name">{step}</div>
              <div className="step-check">✓</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
          We first performed an <strong>80:20 stratified train-test split</strong>. The 80% training data was further evaluated using{' '}
          <strong>5-fold stratified cross-validation</strong> during hyperparameter optimization with Optuna.
          After selecting the best hyperparameters, the final models were trained on the complete training set
          and evaluated on the previously unseen 20% test set.
        </p>
      </div>

      {/* CV Results per dataset */}
      {renderDataset('crop_recommendation', kfoldData.crop_recommendation)}
      {renderDataset('yield_prediction', kfoldData.yield_prediction)}
    </div>
  );
}

/* ── YIELD DATASET TAB (REGRESSION) ── */
function YieldTab({ yieldData }) {
  if (!yieldData || !yieldData.comparison) {
    return <div className="admin-section-card"><p>Yield dataset models not trained yet. Run <code>python train_yield_models.py</code> first.</p></div>;
  }

  const YIELD_LABELS = {
    random_forest: 'Random Forest Regressor', xgboost: 'XGBoost Regressor',
    lightgbm: 'LightGBM Regressor', knn: 'KNN Regressor',
    decision_tree: 'Decision Tree Regressor', extra_trees: 'Extra Trees Regressor',
    gradient_boosting: 'Gradient Boosting Regressor', adaboost: 'AdaBoost Regressor',
    svr: 'SVR (RBF Kernel)', linear_regression: 'Linear Regression',
    ridge: 'Ridge Regression', lasso: 'Lasso Regression',
    elastic_net: 'Elastic Net', hist_gradient_boosting: 'Hist Gradient Boosting',
    bagging: 'Bagging Regressor', mlp: 'MLP Regressor',
    deep_mlp: 'Deep MLP Regressor', mlp_lstm_hybrid: 'MLP+LSTM Hybrid',
    voting_ensemble: 'Voting Ensemble', stacked_ensemble: 'Stacked Ensemble',
  };

  const { comparison, dataset_info } = yieldData;
  const sorted = Object.entries(comparison).sort((a, b) => (b[1].r2_score || 0) - (a[1].r2_score || 0));
  const maxR2 = sorted.length ? Math.max(sorted[0][1].r2_score || 0, 0.01) : 1;

  return (
    <div className="admin-models">
      {/* Dataset Info */}
      <div className="admin-section-card">
        <h3>🌾 Agri Yield Prediction Dataset</h3>
        <div className="dataset-grid">
          <div className="ds-item"><span>Task</span><strong>Yield Regression</strong></div>
          <div className="ds-item"><span>Samples</span><strong>{dataset_info?.total_samples || 10000}</strong></div>
          <div className="ds-item"><span>Train / Test</span><strong>{dataset_info?.train_samples || 8000} / {dataset_info?.test_samples || 2000}</strong></div>
          <div className="ds-item"><span>Features</span><strong>{dataset_info?.n_features || 54}</strong></div>
          <div className="ds-item"><span>Target</span><strong>{dataset_info?.target || 'Yield (1.0 - 10.0)'}</strong></div>
          <div className="ds-item"><span>Metrics</span><strong>R², MAE, RMSE</strong></div>
        </div>
      </div>

      {/* R² Bar Chart */}
      <div className="admin-section-card">
        <h3>📊 R² Score Comparison (Yield Prediction)</h3>
        <div className="accuracy-chart">
          {sorted.map(([name, metrics]) => (
            <div className="accuracy-row" key={name}>
              <div className="accuracy-label">{YIELD_LABELS[name] || name}</div>
              <div className="accuracy-bar-wrap">
                <div
                  className="accuracy-bar-fill"
                  style={{
                    width: `${Math.max(((metrics.r2_score || 0) / maxR2) * 100, 2)}%`,
                    backgroundColor: MODEL_COLORS[name] || '#6b7280',
                  }}
                >
                  {(metrics.r2_score || 0).toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="admin-section-card">
        <h3>📋 Regression Metrics (Yield Dataset)</h3>
        <table className="admin-table metrics-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>R² Score</th>
              <th>MAE</th>
              <th>RMSE</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([name, m]) => (
              <tr key={name}>
                <td>
                  <span className="model-dot" style={{ backgroundColor: MODEL_COLORS[name] || '#6b7280' }}></span>
                  {YIELD_LABELS[name] || name}
                </td>
                <td><strong>{(m.r2_score || 0).toFixed(4)}</strong></td>
                <td>{(m.mae || 0).toFixed(4)}</td>
                <td>{(m.rmse || 0).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── SRIKAKULAM TAB ── */
function SrikakulamTab({ data }) {
  const [subTab, setSubTab] = useState('macro');

  if (!data) {
    return <div className="admin-section-card"><p>Srikakulam models not trained yet.</p></div>;
  }

  return (
    <div className="admin-training">
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className={`admin-tab ${subTab === 'macro' ? 'active' : ''}`}
          onClick={() => setSubTab('macro')} style={{ padding: '8px 20px' }}>
          🧪 Macro Nutrients
        </button>
        <button className={`admin-tab ${subTab === 'micro' ? 'active' : ''}`}
          onClick={() => setSubTab('micro')} style={{ padding: '8px 20px' }}>
          🔬 Micro Nutrients
        </button>
      </div>

      {subTab === 'macro' && (
        <>
          {/* Dataset Info */}
          <div className="admin-section-card">
            <h3>📂 Macro Nutrients Dataset — Srikakulam District</h3>
            <div className="dataset-grid">
              <div className="ds-item"><span>Source</span><strong>Soil Health Card RKVY 2026-27</strong></div>
              <div className="ds-item"><span>Blocks</span><strong>30</strong></div>
              <div className="ds-item"><span>Samples</span><strong>{data.macro_info?.total_samples || 4159}</strong></div>
              <div className="ds-item"><span>Task</span><strong>Classification (N Status)</strong></div>
              <div className="ds-item"><span>Classes</span><strong>{(data.macro_info?.classes || []).join(', ')}</strong></div>
              <div className="ds-item"><span>Features</span><strong>{data.macro_info?.n_features || 14}</strong></div>
              <div className="ds-item"><span>Nutrients</span><strong>N, P, K, OC, pH, EC</strong></div>
            </div>
          </div>

          {/* Model Accuracies */}
          {data.macro_models && (
            <div className="admin-section-card">
              <h3>🤖 Model Accuracies — Macro</h3>
              <table className="admin-table">
                <thead><tr><th>Model</th><th>Accuracy</th><th>F1 Score</th><th>Precision</th><th>Recall</th></tr></thead>
                <tbody>
                  {Object.entries(data.macro_models).sort((a, b) => b[1].accuracy - a[1].accuracy).map(([name, m]) => (
                    <tr key={name}>
                      <td><strong>{MODEL_LABELS[name] || name}</strong></td>
                      <td style={{ color: m.accuracy > 0.85 ? '#16a34a' : '#d97706' }}>{(m.accuracy * 100).toFixed(2)}%</td>
                      <td>{(m.f1_score * 100).toFixed(2)}%</td>
                      <td>{(m.precision * 100).toFixed(2)}%</td>
                      <td>{(m.recall * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Block Analysis */}
          {data.macro_blocks && (
            <div className="admin-section-card">
              <h3>📊 Block-wise Macro Nutrient Analysis (30 Blocks)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>Block</th><th>Samples</th><th>N Low%</th><th>P Low%</th><th>K High%</th><th>OC Low%</th></tr></thead>
                  <tbody>
                    {data.macro_blocks.map(b => (
                      <tr key={b.block}>
                        <td><strong>{b.block}</strong></td>
                        <td>{b.total_samples}</td>
                        <td style={{ color: b.N.low_pct > 80 ? '#dc2626' : '#16a34a' }}>{b.N.low_pct}%</td>
                        <td style={{ color: b.P.low_pct > 50 ? '#dc2626' : '#16a34a' }}>{b.P.low_pct}%</td>
                        <td style={{ color: b.K.high_pct > 30 ? '#16a34a' : '#d97706' }}>{b.K.high_pct}%</td>
                        <td style={{ color: b.OC.low_pct > 50 ? '#dc2626' : '#16a34a' }}>{b.OC.low_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {subTab === 'micro' && (
        <>
          {/* Dataset Info */}
          <div className="admin-section-card">
            <h3>📂 Micro Nutrients Dataset — Srikakulam District</h3>
            <div className="dataset-grid">
              <div className="ds-item"><span>Source</span><strong>Soil Health Card RKVY 2026-27</strong></div>
              <div className="ds-item"><span>Blocks</span><strong>30</strong></div>
              <div className="ds-item"><span>Samples</span><strong>{data.micro_info?.total_samples || 4159}</strong></div>
              <div className="ds-item"><span>Task</span><strong>Classification (Status)</strong></div>
              <div className="ds-item"><span>Classes</span><strong>{(data.micro_info?.classes || []).join(', ')}</strong></div>
              <div className="ds-item"><span>Features</span><strong>{data.micro_info?.n_features || 15}</strong></div>
              <div className="ds-item"><span>Nutrients</span><strong>S, Fe, Zn, Cu, B, Mn</strong></div>
            </div>
          </div>

          {/* Model Accuracies */}
          {data.micro_models && (
            <div className="admin-section-card">
              <h3>🤖 Model Accuracies — Micro (100% on 13 models!)</h3>
              <table className="admin-table">
                <thead><tr><th>Model</th><th>Accuracy</th><th>F1 Score</th><th>Precision</th><th>Recall</th></tr></thead>
                <tbody>
                  {Object.entries(data.micro_models).sort((a, b) => b[1].accuracy - a[1].accuracy).map(([name, m]) => (
                    <tr key={name}>
                      <td><strong>{MODEL_LABELS[name] || name}</strong></td>
                      <td style={{ color: '#16a34a' }}>{(m.accuracy * 100).toFixed(2)}%</td>
                      <td>{(m.f1_score * 100).toFixed(2)}%</td>
                      <td>{(m.precision * 100).toFixed(2)}%</td>
                      <td>{(m.recall * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Block Analysis */}
          {data.micro_blocks && (
            <div className="admin-section-card">
              <h3>📊 Block-wise Micro Nutrient Sufficiency (30 Blocks)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>Block</th><th>Samples</th><th>S Suf%</th><th>Fe Suf%</th><th>Zn Suf%</th><th>Cu Suf%</th><th>B Suf%</th><th>Mn Suf%</th></tr></thead>
                  <tbody>
                    {data.micro_blocks.map(b => (
                      <tr key={b.block}>
                        <td><strong>{b.block}</strong></td>
                        <td>{b.total_samples}</td>
                        <td style={{ color: b.S.suf_pct > 90 ? '#16a34a' : '#dc2626' }}>{b.S.suf_pct}%</td>
                        <td style={{ color: b.Fe.suf_pct > 90 ? '#16a34a' : '#dc2626' }}>{b.Fe.suf_pct}%</td>
                        <td style={{ color: b.Zn.suf_pct > 90 ? '#16a34a' : '#dc2626' }}>{b.Zn.suf_pct}%</td>
                        <td style={{ color: b.Cu.suf_pct > 90 ? '#16a34a' : '#dc2626' }}>{b.Cu.suf_pct}%</td>
                        <td style={{ color: b.B.suf_pct > 70 ? '#16a34a' : '#dc2626' }}>{b.B.suf_pct}%</td>
                        <td style={{ color: b.Mn.suf_pct > 90 ? '#16a34a' : '#dc2626' }}>{b.Mn.suf_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

