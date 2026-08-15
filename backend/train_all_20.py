"""Train all 20 models: 4 classical + 14 extended + stacked ensemble + quantum hybrid + quantum RF."""
import os, sys, time, json, joblib

os.environ['DJANGO_SETTINGS_MODULE'] = 'quantum_soil.settings'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from api.ml.data_preprocessing import DataPreprocessor
from api.ml.classical_models import ClassicalModels
from api.ml.extended_models import ExtendedModels
from api.ml.stacked_ensemble import StackedEnsemble
from api.ml.quantum_model import QuantumMLModel
from api.ml.quantum_random_forest import QuantumRandomForest

dataset_path = os.path.join('..', 'DATASETS', 'Crop_recommendation.csv')
models_dir = 'trained_models'
os.makedirs(models_dir, exist_ok=True)

# ── Step 1: Preprocess ──
print('=' * 70)
print('  TRAINING ALL 20 MODELS')
print('=' * 70)
total_start = time.time()

dp = DataPreprocessor(dataset_path)
dp.load_data()
dp.clean_data()
data = dp.split_data()
dp.save_artifacts(models_dir)

X_train, X_test = data['X_train'], data['X_test']
y_train, y_test = data['y_train'], data['y_test']

comparison = {}

# ── Step 2: Classical Models (RF, XGBoost, LightGBM, KNN) ──
print('\n' + '-' * 50)
print('Step 2: Classical Models (4)')
print('-' * 50)

classical = ClassicalModels()
classical.train_all(X_train, y_train)
classical_results = classical.evaluate_all(X_test, y_test)
classical.save_models(models_dir)
comparison.update(classical_results)

# ── Step 3: Extended Models (14 new) ──
print('\n' + '-' * 50)
print('Step 3: Extended Models (14)')
print('-' * 50)

extended = ExtendedModels()
extended.train_all(X_train, y_train)
extended_results = extended.evaluate_all(X_test, y_test)
extended.save_models(models_dir)
comparison.update(extended_results)

# ── Step 4: Stacked Ensemble ──
print('\n' + '-' * 50)
print('Step 4: Stacked Ensemble')
print('-' * 50)

ensemble = StackedEnsemble()
ensemble.train(X_train, y_train)
ensemble_results = ensemble.evaluate(X_test, y_test)
ensemble.save(models_dir)
comparison['stacked_ensemble'] = ensemble_results

# ── Step 5: Quantum Hybrid SVM ──
print('\n' + '-' * 50)
print('Step 5: Quantum Hybrid SVM')
print('-' * 50)

try:
    qm = QuantumMLModel(n_qubits=4, n_layers=3, n_samples=880)
    qm_results = qm.train(X_train, y_train, X_test, y_test)
    qm.save(models_dir)
    comparison['quantum_ml'] = {
        'accuracy': qm_results['accuracy'],
        'precision': qm_results['precision'],
        'recall': qm_results['recall'],
        'f1_score': qm_results['f1_score'],
    }
    joblib.dump(qm_results, os.path.join(models_dir, 'quantum_results.joblib'))
except Exception as e:
    print(f'Quantum SVM Error: {e}')

# ── Step 6: Quantum Random Forest ──
print('\n' + '-' * 50)
print('Step 6: Quantum Random Forest')
print('-' * 50)

try:
    qrf = QuantumRandomForest(n_qubits=4, n_layers=3, n_samples=880)
    qrf_results = qrf.train(X_train, y_train, X_test, y_test)
    qrf.save(models_dir)
    comparison['quantum_random_forest'] = {
        'accuracy': qrf_results['accuracy'],
        'precision': qrf_results['precision'],
        'recall': qrf_results['recall'],
        'f1_score': qrf_results['f1_score'],
    }
    joblib.dump(qrf_results, os.path.join(models_dir, 'quantum_rf_results.joblib'))
except Exception as e:
    print(f'Quantum RF Error: {e}')

# ── Final Summary ──
total_time = time.time() - total_start

print('\n' + '=' * 70)
print('  ALL 20 MODELS - RESULTS')
print('=' * 70)
print(f"\n{'Model':<25} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
print('-' * 65)

sorted_models = sorted(comparison.items(), key=lambda x: x[1].get('accuracy', 0), reverse=True)
for name, m in sorted_models:
    print(f"{name:<25} {m.get('accuracy',0):>10.4f} {m.get('precision',0):>10.4f} "
          f"{m.get('recall',0):>10.4f} {m.get('f1_score',0):>10.4f}")

print(f"\nTotal: {len(comparison)} models trained in {total_time:.1f}s")

# Save comparison JSON
json_comp = {}
for name, m in comparison.items():
    json_comp[name] = {k: float(v) for k, v in m.items() if isinstance(v, (int, float))}

with open(os.path.join(models_dir, 'model_comparison.json'), 'w') as f:
    json.dump(json_comp, f, indent=2)

print(f"\nSaved model_comparison.json with {len(json_comp)} models")
print('=' * 70)
