"""
Soil Health / Fertility Score Module
Generates an overall soil health score (0-100) based on N, P, K, temperature, humidity, pH, rainfall.
Uses only the 7 features present in the dataset — no external parameters.
"""

import numpy as np


class SoilHealthScorer:
    """Computes a composite soil health/fertility score from the 7 dataset features."""

    # Optimal ranges for scoring — based on Indian agricultural standards
    OPTIMAL_RANGES = {
        'nitrogen': {'min': 40, 'max': 80, 'weight': 0.20},
        'phosphorus': {'min': 20, 'max': 60, 'weight': 0.15},
        'potassium': {'min': 30, 'max': 60, 'weight': 0.15},
        'ph': {'min': 6.0, 'max': 7.5, 'weight': 0.20},
        'temperature': {'min': 20, 'max': 35, 'weight': 0.10},
        'humidity': {'min': 50, 'max': 80, 'weight': 0.10},
        'rainfall': {'min': 100, 'max': 300, 'weight': 0.10},
    }

    GRADES = [
        (0, 25, 'Very Poor', 'Soil requires significant amendment. Not suitable for most crops without intervention.'),
        (25, 40, 'Poor', 'Soil is below optimal conditions. Major improvements needed in nutrient content and pH.'),
        (40, 55, 'Fair', 'Soil has moderate growing potential. Some amendments recommended for better yields.'),
        (55, 70, 'Good', 'Soil is in good condition. Minor adjustments may further improve crop productivity.'),
        (70, 85, 'Very Good', 'Soil is well-suited for agriculture. Excellent growing conditions with balanced nutrients.'),
        (85, 100, 'Excellent', 'Outstanding soil quality. Optimal nutrient balance and conditions for maximum crop yield.'),
    ]

    def _score_parameter(self, value, optimal_min, optimal_max):
        """
        Score a single parameter (0 to 1).
        Full score if within optimal range, decreasing outside.
        """
        if optimal_min <= value <= optimal_max:
            return 1.0

        range_size = optimal_max - optimal_min
        if range_size == 0:
            range_size = 1

        if value < optimal_min:
            distance = optimal_min - value
            score = max(0, 1 - (distance / (optimal_min + range_size)))
        else:
            distance = value - optimal_max
            score = max(0, 1 - (distance / (optimal_max + range_size)))

        return score

    def compute_score(self, nitrogen, phosphorus, potassium, ph, temperature, humidity, rainfall):
        """
        Compute the overall soil health score (0-100).

        Parameters (the 7 dataset features):
        -----------
        nitrogen : float — Nitrogen level (N)
        phosphorus : float — Phosphorus level (P)
        potassium : float — Potassium level (K)
        ph : float — Soil pH (0-14)
        temperature : float — Temperature (°C)
        humidity : float — Relative humidity (%)
        rainfall : float — Rainfall (mm)

        Returns:
        --------
        dict with score, grade, interpretation, and per-parameter breakdown
        """
        params = {
            'nitrogen': nitrogen,
            'phosphorus': phosphorus,
            'potassium': potassium,
            'ph': ph,
            'temperature': temperature,
            'humidity': humidity,
            'rainfall': rainfall,
        }

        breakdown = {}
        weighted_score = 0

        for param_name, value in params.items():
            config = self.OPTIMAL_RANGES[param_name]
            param_score = self._score_parameter(value, config['min'], config['max'])
            weighted_contribution = param_score * config['weight']
            weighted_score += weighted_contribution

            breakdown[param_name] = {
                'value': round(value, 2),
                'score': round(param_score * 100, 1),
                'weight': config['weight'],
                'contribution': round(weighted_contribution * 100, 1),
                'optimal_range': f"{config['min']} - {config['max']}",
                'in_range': config['min'] <= value <= config['max'],
            }

        # Convert to 0-100 scale
        final_score = round(weighted_score * 100, 1)
        final_score = min(100, max(0, final_score))

        # Get grade
        grade = 'Unknown'
        interpretation = ''
        for low, high, g, interp in self.GRADES:
            if low <= final_score <= high:
                grade = g
                interpretation = interp
                break

        return {
            'score': final_score,
            'grade': grade,
            'interpretation': interpretation,
            'breakdown': breakdown,
        }
