"""
Hyperparameter Optimization Module
Uses Optuna for Bayesian hyperparameter optimization of all base models.
"""

import optuna
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.model_selection import cross_val_score
import numpy as np

# Suppress Optuna logging
optuna.logging.set_verbosity(optuna.logging.WARNING)


class HyperparameterOptimizer:
    """Optimizes hyperparameters for each ML model using Optuna."""

    def __init__(self, n_trials=50):
        self.n_trials = n_trials
        self.best_params = {}
        self.optimization_history = {}

    def _optimize_random_forest(self, X, y):
        """Optimize Random Forest hyperparameters."""
        def objective(trial):
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 300),
                'max_depth': trial.suggest_int('max_depth', 5, 30),
                'min_samples_split': trial.suggest_int('min_samples_split', 2, 10),
                'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 5),
                'max_features': trial.suggest_categorical('max_features', ['sqrt', 'log2', None]),
                'random_state': 42,
                'n_jobs': -1,
            }
            model = RandomForestClassifier(**params)
            scores = cross_val_score(model, X, y, cv=5, scoring='accuracy', n_jobs=1)
            return scores.mean()

        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=self.n_trials, show_progress_bar=False)
        self.best_params['random_forest'] = study.best_params
        self.best_params['random_forest']['random_state'] = 42
        self.best_params['random_forest']['n_jobs'] = -1
        self.optimization_history['random_forest'] = {
            'best_score': study.best_value,
            'n_trials': len(study.trials),
        }
        print(f"[HPO] Random Forest best accuracy: {study.best_value:.4f}")
        return study.best_params

    def _optimize_xgboost(self, X, y):
        """Optimize XGBoost hyperparameters."""
        def objective(trial):
            try:
                params = {
                    'n_estimators': trial.suggest_int('n_estimators', 50, 200),
                    'max_depth': trial.suggest_int('max_depth', 3, 10),
                    'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                    'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                    'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                    'min_child_weight': trial.suggest_int('min_child_weight', 1, 7),
                    'gamma': trial.suggest_float('gamma', 0.0, 0.5),
                    'random_state': 42,
                    'eval_metric': 'mlogloss',
                    'tree_method': 'hist',
                    'n_jobs': 1,
                }
                model = XGBClassifier(**params)
                scores = cross_val_score(model, X, y, cv=5, scoring='accuracy', n_jobs=1)
                return scores.mean()
            except Exception:
                return 0.0

        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=self.n_trials, show_progress_bar=False)
        self.best_params['xgboost'] = study.best_params
        self.best_params['xgboost']['random_state'] = 42
        self.best_params['xgboost']['eval_metric'] = 'mlogloss'
        self.best_params['xgboost']['tree_method'] = 'hist'
        self.best_params['xgboost']['n_jobs'] = 1
        self.optimization_history['xgboost'] = {
            'best_score': study.best_value,
            'n_trials': len(study.trials),
        }
        print(f"[HPO] XGBoost best accuracy: {study.best_value:.4f}")
        return study.best_params

    def _optimize_lightgbm(self, X, y):
        """Optimize LightGBM hyperparameters."""
        def objective(trial):
            try:
                params = {
                    'n_estimators': trial.suggest_int('n_estimators', 100, 300),
                    'max_depth': trial.suggest_int('max_depth', 3, 15),
                    'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                    'num_leaves': trial.suggest_int('num_leaves', 20, 80),
                    'min_child_samples': trial.suggest_int('min_child_samples', 5, 30),
                    'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                    'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                    'random_state': 42,
                    'verbose': -1,
                }
                model = LGBMClassifier(**params)
                scores = cross_val_score(model, X, y, cv=5, scoring='accuracy', n_jobs=1)
                return scores.mean()
            except Exception:
                return 0.0

        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=self.n_trials, show_progress_bar=False)
        self.best_params['lightgbm'] = study.best_params
        self.best_params['lightgbm']['random_state'] = 42
        self.best_params['lightgbm']['verbose'] = -1
        self.optimization_history['lightgbm'] = {
            'best_score': study.best_value,
            'n_trials': len(study.trials),
        }
        print(f"[HPO] LightGBM best accuracy: {study.best_value:.4f}")
        return study.best_params

    def _optimize_knn(self, X, y):
        """Optimize KNN hyperparameters."""
        def objective(trial):
            params = {
                'n_neighbors': trial.suggest_int('n_neighbors', 3, 15),
                'weights': trial.suggest_categorical('weights', ['uniform', 'distance']),
                'metric': trial.suggest_categorical('metric', ['euclidean', 'manhattan', 'minkowski']),
                'p': trial.suggest_int('p', 1, 3),
                'n_jobs': -1,
            }
            model = KNeighborsClassifier(**params)
            scores = cross_val_score(model, X, y, cv=5, scoring='accuracy', n_jobs=1)
            return scores.mean()

        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=self.n_trials, show_progress_bar=False)
        self.best_params['knn'] = study.best_params
        self.best_params['knn']['n_jobs'] = -1
        self.optimization_history['knn'] = {
            'best_score': study.best_value,
            'n_trials': len(study.trials),
        }
        print(f"[HPO] KNN best accuracy: {study.best_value:.4f}")
        return study.best_params

    def optimize_all(self, X, y):
        """Run optimization for all models."""
        print(f"[HPO] Starting hyperparameter optimization ({self.n_trials} trials per model)...")

        self._optimize_random_forest(X, y)
        self._optimize_xgboost(X, y)
        self._optimize_lightgbm(X, y)
        self._optimize_knn(X, y)

        print("[HPO] Optimization complete!")
        return self.best_params

    def get_summary(self):
        """Get optimization summary."""
        return {
            'best_params': self.best_params,
            'history': self.optimization_history,
        }
