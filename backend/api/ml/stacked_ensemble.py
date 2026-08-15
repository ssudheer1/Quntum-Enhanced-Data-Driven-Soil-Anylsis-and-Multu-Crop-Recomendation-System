"""
Stacked Ensemble Model Module
Combines Random Forest, XGBoost, LightGBM, and KNN using a meta-learner (Logistic Regression).
"""

from sklearn.ensemble import StackingClassifier, RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os
import numpy as np


class StackedEnsemble:
    """Stacked ensemble combining multiple base learners with a meta-learner."""

    def __init__(self, optimized_params=None):
        self.stacking_model = None
        self.results = {}
        self._build_stack(optimized_params)

    def _build_stack(self, params=None):
        """Build the stacking classifier."""
        if params is None:
            params = {}

        # Base learners (Level-0)
        rf_params = params.get('random_forest', {
            'n_estimators': 200, 'max_depth': 20, 'random_state': 42, 'n_jobs': -1
        })
        xgb_params = params.get('xgboost', {
            'n_estimators': 150, 'max_depth': 8, 'learning_rate': 0.1,
            'random_state': 42, 'eval_metric': 'mlogloss',
            'tree_method': 'hist', 'n_jobs': 1
        })
        lgbm_params = params.get('lightgbm', {
            'n_estimators': 200, 'max_depth': 15, 'learning_rate': 0.1,
            'random_state': 42, 'verbose': -1
        })
        knn_params = params.get('knn', {
            'n_neighbors': 5, 'weights': 'distance', 'n_jobs': -1
        })

        base_estimators = [
            ('rf', RandomForestClassifier(**rf_params)),
            ('xgb', XGBClassifier(**xgb_params)),
            ('lgbm', LGBMClassifier(**lgbm_params)),
            ('knn', KNeighborsClassifier(**knn_params)),
        ]

        # Meta-learner (Level-1)
        meta_learner = LogisticRegression(
            max_iter=1000,
            random_state=42,
            solver='lbfgs',
            C=1.0,
        )

        # Stacking with cross-validation
        self.stacking_model = StackingClassifier(
            estimators=base_estimators,
            final_estimator=meta_learner,
            cv=5,
            stack_method='predict_proba',
            n_jobs=1,
            passthrough=False,
        )

    def train(self, X_train, y_train):
        """Train the stacked ensemble."""
        print("[StackedEnsemble] Training stacked ensemble (this may take a minute)...")
        self.stacking_model.fit(X_train, y_train)
        print("[StackedEnsemble] Stacked ensemble trained successfully!")
        return self.stacking_model

    def evaluate(self, X_test, y_test):
        """Evaluate the stacked ensemble."""
        y_pred = self.stacking_model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

        self.results = {
            'accuracy': round(accuracy, 4),
            'precision': round(precision, 4),
            'recall': round(recall, 4),
            'f1_score': round(f1, 4),
        }

        print(f"[StackedEnsemble] Accuracy={accuracy:.4f}, F1={f1:.4f}")
        return self.results

    def predict(self, X):
        """Predict using the stacked ensemble."""
        return self.stacking_model.predict(X)

    def predict_proba(self, X):
        """Get prediction probabilities."""
        return self.stacking_model.predict_proba(X)

    def save(self, save_dir):
        """Save the stacked ensemble model."""
        os.makedirs(save_dir, exist_ok=True)
        path = os.path.join(save_dir, 'stacked_ensemble.joblib')
        joblib.dump(self.stacking_model, path)
        print(f"[StackedEnsemble] Model saved to {path}")

    def load(self, save_dir):
        """Load the stacked ensemble model."""
        path = os.path.join(save_dir, 'stacked_ensemble.joblib')
        if os.path.exists(path):
            self.stacking_model = joblib.load(path)
            print(f"[StackedEnsemble] Model loaded from {path}")
        else:
            raise FileNotFoundError(f"No model found at {path}")
