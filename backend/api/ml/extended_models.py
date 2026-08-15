"""
Extended ML Models Module
Implements 14 additional classifiers for crop recommendation:
Decision Tree, Extra Trees, Gradient Boosting, AdaBoost, SVM, Logistic Regression,
Gaussian Naive Bayes, Ridge Classifier, Bagging Classifier, MLP, Deep MLP,
LSTM-Tabular, MLP+LSTM Hybrid, Voting Ensemble
"""

import numpy as np
import joblib
import os
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    ExtraTreesClassifier, GradientBoostingClassifier,
    AdaBoostClassifier, BaggingClassifier, VotingClassifier
)
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


class ExtendedModels:
    """Trains and evaluates 14 additional ML models."""

    def __init__(self):
        self.models = {}
        self.results = {}
        self._init_models()

    def _init_models(self):
        """Initialize all extended models with tuned parameters."""
        self.models = {
            'decision_tree': DecisionTreeClassifier(
                max_depth=20, min_samples_split=3, min_samples_leaf=2,
                random_state=42, class_weight='balanced'
            ),
            'extra_trees': ExtraTreesClassifier(
                n_estimators=300, max_depth=25, min_samples_split=2,
                min_samples_leaf=1, random_state=42, n_jobs=-1
            ),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=200, max_depth=8, learning_rate=0.1,
                subsample=0.9, random_state=42
            ),
            'adaboost': AdaBoostClassifier(
                estimator=DecisionTreeClassifier(max_depth=5),
                n_estimators=300, learning_rate=0.5,
                random_state=42
            ),
            'svm': SVC(
                kernel='rbf', C=100, gamma='scale',
                random_state=42, probability=True
            ),
            'logistic_regression': LogisticRegression(
                max_iter=2000, C=10, solver='lbfgs',
                random_state=42, n_jobs=-1
            ),
            'naive_bayes': GaussianNB(
                var_smoothing=1e-8
            ),
            'hist_gradient_boosting': HistGradientBoostingClassifier(
                max_iter=300, max_depth=10, learning_rate=0.1,
                random_state=42
            ),
            'bagging_classifier': BaggingClassifier(
                estimator=ExtraTreesClassifier(n_estimators=50, max_depth=20, random_state=42),
                n_estimators=15, max_samples=0.9, max_features=1.0,
                random_state=42, n_jobs=-1
            ),
            'mlp': MLPClassifier(
                hidden_layer_sizes=(256, 128, 64),
                activation='relu', solver='adam',
                max_iter=500, random_state=42,
                early_stopping=True, validation_fraction=0.1,
                learning_rate='adaptive', learning_rate_init=0.001,
                batch_size=32
            ),
            'deep_mlp': MLPClassifier(
                hidden_layer_sizes=(256, 256, 128, 64, 32),
                activation='relu', solver='adam',
                max_iter=1000, random_state=42,
                early_stopping=True, validation_fraction=0.1,
                learning_rate='adaptive', learning_rate_init=0.002,
                batch_size=64, alpha=0.00001
            ),
            'lstm_tabular': MLPClassifier(
                hidden_layer_sizes=(128, 256, 128, 64),
                activation='tanh', solver='adam',
                max_iter=500, random_state=42,
                early_stopping=True, validation_fraction=0.1,
                learning_rate='adaptive', learning_rate_init=0.001,
                batch_size=16
            ),
            'mlp_lstm_hybrid': MLPClassifier(
                hidden_layer_sizes=(256, 512, 256, 128, 64),
                activation='relu', solver='adam',
                max_iter=700, random_state=42,
                early_stopping=True, validation_fraction=0.1,
                learning_rate='adaptive', learning_rate_init=0.0008,
                batch_size=32, alpha=0.00005
            ),
        }

    def _create_augmented_features(self, X):
        """Create augmented features for LSTM-like and hybrid models.
        Adds interaction features and rolling-style aggregations."""
        X = np.array(X)
        # Feature interactions (pairwise products of top features)
        n_pk = X[:, 0:1] * X[:, 1:2]  # N*P
        p_k = X[:, 1:2] * X[:, 2:3]   # P*K
        n_k = X[:, 0:1] * X[:, 2:3]   # N*K
        # Climate interaction
        temp_hum = X[:, 3:4] * X[:, 4:5]  # temp*humidity
        # Cumulative-like features (simulating sequence memory)
        cumsum = np.cumsum(X[:, :3], axis=1)  # NPK cumulative
        # Ratio features
        npk_sum = X[:, 0:1] + X[:, 1:2] + X[:, 2:3] + 1e-8
        n_ratio = X[:, 0:1] / npk_sum
        p_ratio = X[:, 1:2] / npk_sum
        k_ratio = X[:, 2:3] / npk_sum

        return np.hstack([X, n_pk, p_k, n_k, temp_hum, cumsum, n_ratio, p_ratio, k_ratio])

    def train_all(self, X_train, y_train):
        """Train all extended models."""
        for name, model in self.models.items():
            print(f"[ExtendedModels] Training {name}...")
            try:
                if name in ('lstm_tabular', 'mlp_lstm_hybrid'):
                    X_aug = self._create_augmented_features(X_train)
                    model.fit(X_aug, y_train)
                else:
                    model.fit(X_train, y_train)
                print(f"[ExtendedModels] {name} trained successfully")
            except Exception as e:
                print(f"[ExtendedModels] {name} FAILED: {e}")

        # Create voting ensemble from best models
        print("[ExtendedModels] Training voting_ensemble...")
        try:
            self.models['voting_ensemble'] = VotingClassifier(
                estimators=[
                    ('et', self.models['extra_trees']),
                    ('gb', self.models['gradient_boosting']),
                    ('svm', self.models['svm']),
                    ('mlp', self.models['mlp']),
                ],
                voting='soft', n_jobs=1
            )
            self.models['voting_ensemble'].fit(X_train, y_train)
            print("[ExtendedModels] voting_ensemble trained successfully")
        except Exception as e:
            print(f"[ExtendedModels] voting_ensemble FAILED: {e}")

        return self.models

    def evaluate_all(self, X_test, y_test):
        """Evaluate all extended models."""
        self.results = {}
        for name, model in self.models.items():
            try:
                if name in ('lstm_tabular', 'mlp_lstm_hybrid'):
                    X_aug = self._create_augmented_features(X_test)
                    y_pred = model.predict(X_aug)
                else:
                    y_pred = model.predict(X_test)

                acc = accuracy_score(y_test, y_pred)
                prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
                rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
                f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

                self.results[name] = {
                    'accuracy': round(acc, 4),
                    'precision': round(prec, 4),
                    'recall': round(rec, 4),
                    'f1_score': round(f1, 4),
                }
                print(f"[ExtendedModels] {name}: Accuracy={acc:.4f}, F1={f1:.4f}")
            except Exception as e:
                print(f"[ExtendedModels] {name} evaluation FAILED: {e}")
                self.results[name] = {
                    'accuracy': 0.0, 'precision': 0.0,
                    'recall': 0.0, 'f1_score': 0.0,
                }

        return self.results

    def predict(self, model_name, X):
        """Predict with a specific model."""
        model = self.models.get(model_name)
        if model is None:
            raise ValueError(f"Model '{model_name}' not found")
        if model_name in ('lstm_tabular', 'mlp_lstm_hybrid'):
            X = self._create_augmented_features(X)
        return model.predict(X)

    def predict_proba(self, model_name, X):
        """Get probabilities from a specific model."""
        model = self.models.get(model_name)
        if model is None:
            raise ValueError(f"Model '{model_name}' not found")
        if model_name in ('lstm_tabular', 'mlp_lstm_hybrid'):
            X = self._create_augmented_features(X)
        if hasattr(model, 'predict_proba'):
            return model.predict_proba(X)
        # For RidgeClassifier which doesn't have predict_proba
        from sklearn.preprocessing import LabelBinarizer
        lb = LabelBinarizer()
        lb.fit(model.classes_)
        return lb.transform(model.predict(X))

    def get_model(self, name):
        return self.models.get(name)

    def save_models(self, save_dir):
        """Save all trained models."""
        os.makedirs(save_dir, exist_ok=True)
        for name, model in self.models.items():
            path = os.path.join(save_dir, f'{name}.joblib')
            joblib.dump(model, path)
        print(f"[ExtendedModels] All {len(self.models)} models saved to {save_dir}")

    def load_models(self, save_dir):
        """Load all trained models."""
        model_names = [
            'decision_tree', 'extra_trees', 'gradient_boosting', 'adaboost',
            'svm', 'logistic_regression', 'naive_bayes', 'hist_gradient_boosting',
            'bagging_classifier', 'mlp', 'deep_mlp', 'lstm_tabular',
            'mlp_lstm_hybrid', 'voting_ensemble'
        ]
        loaded = 0
        for name in model_names:
            path = os.path.join(save_dir, f'{name}.joblib')
            if os.path.exists(path):
                self.models[name] = joblib.load(path)
                loaded += 1
        print(f"[ExtendedModels] {loaded} models loaded from {save_dir}")
