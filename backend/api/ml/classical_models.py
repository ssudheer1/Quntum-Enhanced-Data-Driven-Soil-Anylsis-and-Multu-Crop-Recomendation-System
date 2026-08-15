"""
Classical ML Models Module
Implements Random Forest, XGBoost, LightGBM, and KNN classifiers for crop recommendation.
"""

from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import numpy as np
import joblib
import os


class ClassicalModels:
    """Trains and evaluates classical ML models for crop recommendation."""

    def __init__(self):
        self.models = {}
        self.results = {}
        self._init_models()

    def _init_models(self, params=None):
        """Initialize all base models with default or custom parameters."""
        if params is None:
            params = {}

        rf_params = params.get('random_forest', {
            'n_estimators': 200,
            'max_depth': 20,
            'min_samples_split': 2,
            'min_samples_leaf': 1,
            'random_state': 42,
            'n_jobs': -1,
        })

        xgb_params = params.get('xgboost', {
            'n_estimators': 150,
            'max_depth': 8,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'eval_metric': 'mlogloss',
            'tree_method': 'hist',
            'n_jobs': 1,
        })

        lgbm_params = params.get('lightgbm', {
            'n_estimators': 200,
            'max_depth': 15,
            'learning_rate': 0.1,
            'num_leaves': 31,
            'random_state': 42,
            'verbose': -1,
        })

        knn_params = params.get('knn', {
            'n_neighbors': 5,
            'weights': 'distance',
            'metric': 'minkowski',
            'n_jobs': -1,
        })

        self.models = {
            'random_forest': RandomForestClassifier(**rf_params),
            'xgboost': XGBClassifier(**xgb_params),
            'lightgbm': LGBMClassifier(**lgbm_params),
            'knn': KNeighborsClassifier(**knn_params),
        }

    def update_params(self, params):
        """Re-initialize models with optimized parameters."""
        self._init_models(params)

    def train_all(self, X_train, y_train):
        """Train all models."""
        for name, model in self.models.items():
            print(f"[ClassicalModels] Training {name}...")
            model.fit(X_train, y_train)
            print(f"[ClassicalModels] {name} trained successfully")
        return self.models

    def evaluate_all(self, X_test, y_test, label_encoder=None):
        """Evaluate all models and return metrics."""
        self.results = {}
        for name, model in self.models.items():
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

            self.results[name] = {
                'accuracy': round(accuracy, 4),
                'precision': round(precision, 4),
                'recall': round(recall, 4),
                'f1_score': round(f1, 4),
            }

            print(f"[ClassicalModels] {name}: Accuracy={accuracy:.4f}, F1={f1:.4f}")

        return self.results

    def predict(self, model_name, X):
        """Predict using a specific model."""
        model = self.models.get(model_name)
        if model is None:
            raise ValueError(f"Model '{model_name}' not found")
        return model.predict(X)

    def predict_proba(self, model_name, X):
        """Get prediction probabilities from a specific model."""
        model = self.models.get(model_name)
        if model is None:
            raise ValueError(f"Model '{model_name}' not found")
        return model.predict_proba(X)

    def get_model(self, name):
        """Get a trained model by name."""
        return self.models.get(name)

    def save_models(self, save_dir):
        """Save all trained models."""
        os.makedirs(save_dir, exist_ok=True)
        for name, model in self.models.items():
            path = os.path.join(save_dir, f'{name}.joblib')
            joblib.dump(model, path)
        print(f"[ClassicalModels] All models saved to {save_dir}")

    def load_models(self, save_dir):
        """Load all trained models."""
        for name in ['random_forest', 'xgboost', 'lightgbm', 'knn']:
            path = os.path.join(save_dir, f'{name}.joblib')
            if os.path.exists(path):
                self.models[name] = joblib.load(path)
        print(f"[ClassicalModels] Models loaded from {save_dir}")
