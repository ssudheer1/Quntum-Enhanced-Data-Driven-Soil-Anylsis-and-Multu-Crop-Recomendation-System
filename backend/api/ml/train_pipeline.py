"""
Training Pipeline Module
Orchestrates the complete ML training pipeline:
Preprocessing > HPO > Classical Models > Stacked Ensemble > Quantum ML > SHAP > Save
"""

import os
import sys
import json
import time
import joblib
import numpy as np

# Add parent paths
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from api.ml.data_preprocessing import DataPreprocessor
from api.ml.classical_models import ClassicalModels
from api.ml.stacked_ensemble import StackedEnsemble
from api.ml.hyperparameter_optimization import HyperparameterOptimizer
from api.ml.quantum_model import QuantumMLModel
from api.ml.shap_explainer import ShapExplainer


def run_training(dataset_path=None, models_dir=None, run_quantum=True, hpo_trials=30):
    """
    Run the complete training pipeline.

    Parameters:
    -----------
    dataset_path : str - Path to Crop_recommendation.csv
    models_dir : str - Directory to save trained models
    run_quantum : bool - Whether to train quantum model (slow)
    hpo_trials : int - Number of Optuna trials per model

    Returns:
    --------
    dict with all results and model comparison
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    if dataset_path is None:
        dataset_path = os.path.join(base_dir, '..', 'DATASETS', 'Crop_recommendation.csv')
    if models_dir is None:
        models_dir = os.path.join(base_dir, 'trained_models')

    os.makedirs(models_dir, exist_ok=True)

    print("=" * 70)
    print("  QUANTUM-ENHANCED SOIL NUTRIENT ANALYSIS - TRAINING PIPELINE")
    print("=" * 70)

    total_start = time.time()
    results = {}

    # ================================================================
    # Step 1: Data Preprocessing
    # ================================================================
    print("\n" + "-" * 50)
    print("Step 1: Data Preprocessing")
    print("-" * 50)

    preprocessor = DataPreprocessor(dataset_path)
    preprocessor.load_data()
    preprocessor.clean_data()
    data = preprocessor.split_data()
    preprocessor.save_artifacts(models_dir)

    X_train = data['X_train']
    X_test = data['X_test']
    y_train = data['y_train']
    y_test = data['y_test']
    X_train_raw = data['X_train_raw']
    X_test_raw = data['X_test_raw']

    results['preprocessing'] = {
        'total_samples': len(X_train) + len(X_test),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'n_features': X_train.shape[1],
        'n_classes': len(data['label_encoder'].classes_),
        'classes': list(data['label_encoder'].classes_),
    }

    # ================================================================
    # Step 2: Hyperparameter Optimization
    # ================================================================
    print("\n" + "-" * 50)
    print("Step 2: Hyperparameter Optimization (Optuna)")
    print("-" * 50)

    hpo = HyperparameterOptimizer(n_trials=hpo_trials)
    best_params = hpo.optimize_all(X_train, y_train)
    results['hyperparameter_optimization'] = hpo.get_summary()

    # Save HPO results
    joblib.dump(best_params, os.path.join(models_dir, 'best_params.joblib'))

    # ================================================================
    # Step 3: Train Classical Models (with optimized params)
    # ================================================================
    print("\n" + "-" * 50)
    print("Step 3: Training Classical Models (Optimized)")
    print("-" * 50)

    classical = ClassicalModels()
    classical.update_params(best_params)
    classical.train_all(X_train, y_train)
    classical_results = classical.evaluate_all(X_test, y_test)
    classical.save_models(models_dir)

    results['classical_models'] = classical_results

    # ================================================================
    # Step 4: Stacked Ensemble
    # ================================================================
    print("\n" + "-" * 50)
    print("Step 4: Training Stacked Ensemble")
    print("-" * 50)

    ensemble = StackedEnsemble(optimized_params=best_params)
    ensemble.train(X_train, y_train)
    ensemble_results = ensemble.evaluate(X_test, y_test)
    ensemble.save(models_dir)

    results['stacked_ensemble'] = ensemble_results

    # ================================================================
    # Step 5: Quantum ML (optional - slow)
    # ================================================================
    if run_quantum:
        print("\n" + "-" * 50)
        print("Step 5: Training Quantum ML Model")
        print("-" * 50)

        try:
            quantum = QuantumMLModel(n_qubits=4, n_layers=3, n_samples=880)
            quantum_results = quantum.train(X_train, y_train, X_test, y_test)
            quantum.save(models_dir)
            results['quantum_ml'] = quantum_results
        except Exception as e:
            print(f"[QuantumML] Error during training: {e}")
            results['quantum_ml'] = {
                'accuracy': 0.0,
                'precision': 0.0,
                'recall': 0.0,
                'f1_score': 0.0,
                'error': str(e),
            }
    else:
        print("\n[Pipeline] Skipping Quantum ML (set run_quantum=True to enable)")
        results['quantum_ml'] = {'skipped': True}

    # ================================================================
    # Step 6: SHAP Explainability (initialize and save)
    # ================================================================
    print("\n" + "-" * 50)
    print("Step 6: Initializing SHAP Explainer")
    print("-" * 50)

    try:
        shap_exp = ShapExplainer()
        # Use Random Forest for SHAP (best tree-based support)
        rf_model = classical.get_model('random_forest')
        shap_exp.init_explainer(rf_model)

        # Generate global feature importance
        sample_size = min(200, len(X_test))
        global_importance = shap_exp.get_global_importance(X_test[:sample_size])
        results['shap_global_importance'] = global_importance
        print("[SHAP] Global feature importance computed")

        # Save SHAP explainer info
        joblib.dump({'global_importance': global_importance}, os.path.join(models_dir, 'shap_info.joblib'))
    except Exception as e:
        print(f"[SHAP] Error: {e}")
        results['shap_global_importance'] = []

    # ================================================================
    # Final Summary
    # ================================================================
    total_time = time.time() - total_start

    print("\n" + "=" * 70)
    print("  TRAINING COMPLETE - MODEL COMPARISON")
    print("=" * 70)

    # Build comparison table
    comparison = {}
    for name, metrics in classical_results.items():
        comparison[name] = metrics
    comparison['stacked_ensemble'] = ensemble_results
    if 'quantum_ml' in results and not results['quantum_ml'].get('skipped', False):
        comparison['quantum_ml'] = {
            'accuracy': results['quantum_ml'].get('accuracy', 0),
            'precision': results['quantum_ml'].get('precision', 0),
            'recall': results['quantum_ml'].get('recall', 0),
            'f1_score': results['quantum_ml'].get('f1_score', 0),
        }

    print(f"\n{'Model':<25} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1-Score':>10}")
    print("-" * 65)
    for name, metrics in comparison.items():
        print(f"{name:<25} {metrics['accuracy']:>10.4f} {metrics['precision']:>10.4f} "
              f"{metrics['recall']:>10.4f} {metrics['f1_score']:>10.4f}")

    print(f"\nTotal training time: {total_time:.1f} seconds")
    print("=" * 70)

    results['model_comparison'] = comparison
    results['training_time'] = round(total_time, 1)

    # Save full results
    joblib.dump(results, os.path.join(models_dir, 'training_results.joblib'))

    # Save comparison as JSON for easy loading
    json_comparison = {}
    for name, metrics in comparison.items():
        json_comparison[name] = {k: float(v) for k, v in metrics.items() if isinstance(v, (int, float))}

    with open(os.path.join(models_dir, 'model_comparison.json'), 'w') as f:
        json.dump(json_comparison, f, indent=2)

    return results


if __name__ == '__main__':
    # Run from command line
    results = run_training(run_quantum=True, hpo_trials=30)
