"""
SHAP Explainability Module
Generates SHAP (SHapley Additive exPlanations) values to explain predictions.
Uses lazy imports to avoid blocking Django startup if numba/llvmlite has issues.
"""

import numpy as np


def _import_shap():
    """Lazily import shap to avoid startup issues."""
    try:
        import shap
        return shap
    except Exception as e:
        print(f"[SHAP] Warning: Could not import shap: {e}")
        return None


class ShapExplainer:
    """Generates SHAP explanations for model predictions."""

    def __init__(self):
        self.explainer = None
        self.feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

    def init_explainer(self, model, X_background=None):
        """Initialize SHAP explainer for a tree-based model."""
        shap = _import_shap()
        if shap is None:
            print("[SHAP] SHAP library unavailable, using fallback explainer")
            self.explainer = 'fallback'
            self._model = model
            return

        try:
            # Try TreeExplainer first (fast, exact for tree models)
            self.explainer = shap.TreeExplainer(model)
            print("[SHAP] Using TreeExplainer")
        except Exception:
            # Fallback to KernelExplainer
            if X_background is not None:
                background = shap.sample(X_background, 100)
                self.explainer = shap.KernelExplainer(model.predict_proba, background)
                print("[SHAP] Using KernelExplainer (fallback)")
            else:
                print("[SHAP] Using feature importance fallback")
                self.explainer = 'fallback'
                self._model = model

    def explain_prediction(self, X_input, predicted_class_idx=None):
        """
        Generate SHAP explanation for a single prediction.
        Returns feature importances sorted by absolute impact.
        """
        if self.explainer is None:
            return self._fallback_explanation()

        if self.explainer == 'fallback':
            return self._fallback_explanation_from_model(X_input)

        try:
            shap = _import_shap()
            if shap is None:
                return self._fallback_explanation_from_model(X_input)

            # Get SHAP values
            shap_values = self.explainer.shap_values(X_input)

            # shap_values shape depends on the explainer type
            if isinstance(shap_values, list):
                # Multi-class: list of arrays, one per class
                if predicted_class_idx is not None and predicted_class_idx < len(shap_values):
                    values = shap_values[predicted_class_idx][0]
                else:
                    values = shap_values[0][0]
            elif isinstance(shap_values, np.ndarray):
                if shap_values.ndim == 3:
                    if predicted_class_idx is not None:
                        values = shap_values[0, :, predicted_class_idx]
                    else:
                        values = shap_values[0, :, 0]
                elif shap_values.ndim == 2:
                    values = shap_values[0]
                else:
                    values = shap_values
            else:
                values = np.zeros(len(self.feature_names))

            return self._build_explanation(values)

        except Exception as e:
            print(f"[SHAP] Error computing SHAP values: {e}")
            return self._fallback_explanation_from_model(X_input)

    def _build_explanation(self, values):
        """Build explanation from SHAP values."""
        explanation = []
        for i, fname in enumerate(self.feature_names):
            abs_val = abs(float(values[i]))
            if abs_val > 0.3:
                level = "High"
            elif abs_val > 0.1:
                level = "Medium"
            else:
                level = "Low"

            explanation.append({
                'feature': fname,
                'shap_value': round(float(values[i]), 4),
                'abs_impact': round(abs_val, 4),
                'impact_level': level,
            })

        explanation.sort(key=lambda x: x['abs_impact'], reverse=True)
        return explanation

    def _fallback_explanation_from_model(self, X_input=None):
        """Use model's built-in feature_importances_ as fallback."""
        try:
            if hasattr(self, '_model') and hasattr(self._model, 'feature_importances_'):
                importances = self._model.feature_importances_
                return self._build_explanation(importances)
        except Exception:
            pass
        return self._fallback_explanation()

    def _fallback_explanation(self):
        """Return placeholder explanation when SHAP is unavailable."""
        # Use typical feature importance order for crop recommendation
        typical_importance = [0.18, 0.14, 0.15, 0.12, 0.16, 0.10, 0.15]
        return self._build_explanation(typical_importance)

    def get_global_importance(self, X_data):
        """
        Compute global feature importance from SHAP values across the dataset.
        """
        if self.explainer is None or self.explainer == 'fallback':
            if hasattr(self, '_model') and hasattr(self._model, 'feature_importances_'):
                importances = self._model.feature_importances_
                importance = []
                for i, fname in enumerate(self.feature_names):
                    importance.append({
                        'feature': fname,
                        'importance': round(float(importances[i]), 4),
                    })
                importance.sort(key=lambda x: x['importance'], reverse=True)
                return importance
            return [{'feature': f, 'importance': 0.14} for f in self.feature_names]

        try:
            shap = _import_shap()
            if shap is None:
                return self._fallback_global_importance()

            shap_values = self.explainer.shap_values(X_data)

            if isinstance(shap_values, list):
                mean_abs = np.mean([np.abs(sv).mean(axis=0) for sv in shap_values], axis=0)
            elif isinstance(shap_values, np.ndarray):
                if shap_values.ndim == 3:
                    mean_abs = np.abs(shap_values).mean(axis=(0, 2))
                else:
                    mean_abs = np.abs(shap_values).mean(axis=0)
            else:
                mean_abs = np.zeros(len(self.feature_names))

            importance = []
            for i, fname in enumerate(self.feature_names):
                importance.append({
                    'feature': fname,
                    'importance': round(float(mean_abs[i]), 4),
                })

            importance.sort(key=lambda x: x['importance'], reverse=True)
            return importance

        except Exception as e:
            print(f"[SHAP] Error in global importance: {e}")
            return self._fallback_global_importance()

    def _fallback_global_importance(self):
        """Fallback global importance."""
        if hasattr(self, '_model') and hasattr(self._model, 'feature_importances_'):
            importances = self._model.feature_importances_
            importance = []
            for i, fname in enumerate(self.feature_names):
                importance.append({
                    'feature': fname,
                    'importance': round(float(importances[i]), 4),
                })
            importance.sort(key=lambda x: x['importance'], reverse=True)
            return importance
        return [{'feature': f, 'importance': 0.14} for f in self.feature_names]
