"""Quick script to retrain ONLY the quantum model with higher accuracy."""
import os, sys, time

os.environ['DJANGO_SETTINGS_MODULE'] = 'quantum_soil.settings'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from api.ml.data_preprocessing import DataPreprocessor
from api.ml.quantum_model import QuantumMLModel

dataset_path = os.path.join('..', 'DATASETS', 'Crop_recommendation.csv')
models_dir = 'trained_models'

# Preprocess
dp = DataPreprocessor(dataset_path)
dp.load_data()
dp.clean_data()
data = dp.split_data()

# Train quantum with MORE samples (880 = 50% of train set)
print('=' * 60)
print('Training Quantum Hybrid Model v3 (High Accuracy)')
print('=' * 60)
start = time.time()

qm = QuantumMLModel(n_qubits=4, n_layers=3, n_samples=880)
results = qm.train(data['X_train'], data['y_train'], data['X_test'], data['y_test'])
qm.save(models_dir)

elapsed = time.time() - start
print(f'\nDONE in {elapsed:.1f}s')
print(f"Accuracy:  {results['accuracy']}")
print(f"Precision: {results['precision']}")
print(f"Recall:    {results['recall']}")
print(f"F1:        {results['f1_score']}")

# Update model_comparison.json and quantum_results.joblib
import json, joblib

comp_path = os.path.join(models_dir, 'model_comparison.json')
if os.path.exists(comp_path):
    with open(comp_path, 'r') as f:
        comparison = json.load(f)
    comparison['quantum_ml'] = {
        'accuracy': results['accuracy'],
        'precision': results['precision'],
        'recall': results['recall'],
        'f1_score': results['f1_score'],
    }
    with open(comp_path, 'w') as f:
        json.dump(comparison, f, indent=2)
    print("Updated model_comparison.json")

# Also update quantum_results.joblib
joblib.dump(results, os.path.join(models_dir, 'quantum_results.joblib'))
print("Updated quantum_results.joblib")
