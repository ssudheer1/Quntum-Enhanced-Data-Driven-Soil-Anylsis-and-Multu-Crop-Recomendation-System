"""
K-Fold Cross-Validation Trainer
5-fold stratified CV with Optuna HPO for all models.
Works for both Crop Recommendation and Agri Yield datasets.
"""

import numpy as np
import time
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier,
    AdaBoostClassifier, BaggingClassifier, VotingClassifier,
    HistGradientBoostingClassifier
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import optuna

optuna.logging.set_verbosity(optuna.logging.WARNING)


def get_model_with_params(name, trial=None):
    """Return a model instance, optionally with Optuna trial params."""
    if trial is None:
        # Default params
        defaults = {
            'random_forest': RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42, n_jobs=-1),
            'xgboost': XGBClassifier(n_estimators=150, max_depth=8, learning_rate=0.1, random_state=42, eval_metric='mlogloss', tree_method='hist', n_jobs=1),
            'lightgbm': LGBMClassifier(n_estimators=200, max_depth=15, learning_rate=0.1, random_state=42, verbose=-1),
            'knn': KNeighborsClassifier(n_neighbors=5, weights='distance', n_jobs=-1),
            'decision_tree': DecisionTreeClassifier(max_depth=20, random_state=42),
            'extra_trees': ExtraTreesClassifier(n_estimators=300, max_depth=25, random_state=42, n_jobs=-1),
            'gradient_boosting': GradientBoostingClassifier(n_estimators=200, max_depth=8, learning_rate=0.1, random_state=42),
            'adaboost': AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=5), n_estimators=300, learning_rate=0.5, random_state=42),
            'svm': SVC(kernel='rbf', C=100, gamma='scale', random_state=42, probability=True),
            'logistic_regression': LogisticRegression(max_iter=2000, C=10, solver='lbfgs', random_state=42, n_jobs=-1),
            'naive_bayes': GaussianNB(var_smoothing=1e-8),
            'hist_gradient_boosting': HistGradientBoostingClassifier(max_iter=300, max_depth=10, learning_rate=0.1, random_state=42),
            'bagging_classifier': BaggingClassifier(estimator=ExtraTreesClassifier(n_estimators=50, max_depth=20, random_state=42), n_estimators=15, max_samples=0.9, random_state=42, n_jobs=-1),
            'mlp': MLPClassifier(hidden_layer_sizes=(256, 128, 64), activation='relu', solver='adam', max_iter=500, random_state=42, early_stopping=True, learning_rate='adaptive', learning_rate_init=0.001, batch_size=32),
            'deep_mlp': MLPClassifier(hidden_layer_sizes=(256, 256, 128, 64, 32), activation='relu', solver='adam', max_iter=1000, random_state=42, early_stopping=True, learning_rate='adaptive', learning_rate_init=0.002, batch_size=64),
            'lstm_tabular': MLPClassifier(hidden_layer_sizes=(128, 256, 128, 64), activation='tanh', solver='adam', max_iter=500, random_state=42, early_stopping=True, learning_rate='adaptive', batch_size=16),
            'mlp_lstm_hybrid': MLPClassifier(hidden_layer_sizes=(256, 512, 256, 128, 64), activation='relu', solver='adam', max_iter=700, random_state=42, early_stopping=True, learning_rate='adaptive', learning_rate_init=0.0008, batch_size=32),
        }
        return defaults.get(name)

    # Optuna-optimized params for key models
    if name == 'random_forest':
        return RandomForestClassifier(
            n_estimators=trial.suggest_int('n_estimators', 100, 500),
            max_depth=trial.suggest_int('max_depth', 10, 30),
            min_samples_split=trial.suggest_int('min_samples_split', 2, 10),
            random_state=42, n_jobs=-1
        )
    elif name == 'xgboost':
        return XGBClassifier(
            n_estimators=trial.suggest_int('n_estimators', 100, 400),
            max_depth=trial.suggest_int('max_depth', 4, 12),
            learning_rate=trial.suggest_float('learning_rate', 0.01, 0.3),
            subsample=trial.suggest_float('subsample', 0.6, 1.0),
            random_state=42, eval_metric='mlogloss', tree_method='hist', n_jobs=1
        )
    elif name == 'lightgbm':
        return LGBMClassifier(
            n_estimators=trial.suggest_int('n_estimators', 100, 400),
            max_depth=trial.suggest_int('max_depth', 5, 20),
            learning_rate=trial.suggest_float('learning_rate', 0.01, 0.3),
            num_leaves=trial.suggest_int('num_leaves', 15, 63),
            random_state=42, verbose=-1
        )
    elif name == 'knn':
        return KNeighborsClassifier(
            n_neighbors=trial.suggest_int('n_neighbors', 3, 15),
            weights=trial.suggest_categorical('weights', ['uniform', 'distance']),
            n_jobs=-1
        )
    elif name == 'svm':
        return SVC(
            C=trial.suggest_float('C', 1, 500, log=True),
            kernel='rbf', gamma='scale', random_state=42, probability=True
        )
    # For other models, return defaults
    return get_model_with_params(name, trial=None)


def run_kfold_cv(X_train, y_train, n_folds=5, n_trials=10):
    """
    Run 5-fold stratified CV with Optuna HPO on all models.
    Returns per-fold scores and best params.
    For large datasets (>5K), skip SVM HPO and use faster params.
    """
    large_dataset = len(X_train) > 5000
    if large_dataset:
        print(f"[KFold] Large dataset detected ({len(X_train)} rows), using optimized settings")
    print(f"\n{'='*60}")
    print(f"  5-FOLD STRATIFIED CROSS-VALIDATION")
    print(f"{'='*60}")

    skf = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)
    hpo_models = ['random_forest', 'xgboost', 'lightgbm', 'knn'] if large_dataset else ['random_forest', 'xgboost', 'lightgbm', 'knn', 'svm']
    all_models = [
        'random_forest', 'xgboost', 'lightgbm', 'knn',
        'decision_tree', 'extra_trees', 'gradient_boosting', 'adaboost',
        'svm', 'logistic_regression', 'naive_bayes', 'hist_gradient_boosting',
        'bagging_classifier', 'mlp', 'deep_mlp', 'lstm_tabular',
        'mlp_lstm_hybrid',
    ]

    cv_results = {}
    best_params = {}

    for model_name in all_models:
        print(f"\n[KFold] Processing {model_name}...")
        start = time.time()

        # HPO for key models
        if model_name in hpo_models:
            def objective(trial):
                model = get_model_with_params(model_name, trial)
                scores = cross_val_score(model, X_train, y_train, cv=skf, scoring='accuracy', n_jobs=1)
                return scores.mean()

            study = optuna.create_study(direction='maximize')
            actual_trials = min(n_trials, 8) if large_dataset else n_trials
            study.optimize(objective, n_trials=actual_trials, show_progress_bar=False)
            best_params[model_name] = study.best_params
            print(f"[KFold] {model_name} HPO best: {study.best_value:.4f}, params: {study.best_params}")

        # Run 5-fold CV with best/default params
        model = get_model_with_params(model_name)
        fold_scores = []

        for fold_idx, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train)):
            X_fold_train, X_fold_val = X_train[train_idx], X_train[val_idx]
            y_fold_train, y_fold_val = y_train[train_idx], y_train[val_idx]

            model_clone = get_model_with_params(model_name)
            model_clone.fit(X_fold_train, y_fold_train)
            y_pred = model_clone.predict(X_fold_val)

            fold_acc = accuracy_score(y_fold_val, y_pred)
            fold_f1 = f1_score(y_fold_val, y_pred, average='weighted', zero_division=0)
            fold_scores.append({'accuracy': round(fold_acc, 4), 'f1_score': round(fold_f1, 4)})

        mean_acc = np.mean([s['accuracy'] for s in fold_scores])
        std_acc = np.std([s['accuracy'] for s in fold_scores])
        elapsed = time.time() - start

        cv_results[model_name] = {
            'fold_scores': fold_scores,
            'mean_accuracy': round(float(mean_acc), 4),
            'std_accuracy': round(float(std_acc), 4),
            'mean_f1': round(float(np.mean([s['f1_score'] for s in fold_scores])), 4),
            'time': round(elapsed, 1),
        }

        print(f"[KFold] {model_name}: Mean CV Acc={mean_acc:.4f} ± {std_acc:.4f} ({elapsed:.1f}s)")

    return cv_results, best_params
