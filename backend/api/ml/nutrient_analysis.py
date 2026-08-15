"""
Nutrient Deficiency Analysis Module
Analyzes N, P, K levels and classifies them as Low/Normal/High based on agricultural standards.
"""


class NutrientAnalyzer:
    """Analyzes soil nutrient levels and identifies deficiencies."""

    # Agricultural reference ranges (mg/kg or ppm equivalent)
    # Based on general Indian agricultural soil standards
    NUTRIENT_RANGES = {
        'nitrogen': {
            'low': (0, 40),
            'normal': (40, 80),
            'high': (80, 300),
            'unit': 'mg/kg',
            'full_name': 'Nitrogen (N)',
        },
        'phosphorus': {
            'low': (0, 20),
            'normal': (20, 60),
            'high': (60, 200),
            'unit': 'mg/kg',
            'full_name': 'Phosphorus (P)',
        },
        'potassium': {
            'low': (0, 30),
            'normal': (30, 60),
            'high': (60, 250),
            'unit': 'mg/kg',
            'full_name': 'Potassium (K)',
        },
    }

    # Recommendations for deficient nutrients
    RECOMMENDATIONS = {
        'nitrogen': {
            'Low': 'Apply nitrogen-rich fertilizers like Urea, Ammonium Nitrate, or organic compost. '
                   'Consider green manure crops (legumes) to fix atmospheric nitrogen.',
            'Normal': 'Nitrogen levels are adequate. Maintain through balanced fertilization and crop rotation.',
            'High': 'Excess nitrogen detected. Reduce nitrogen fertilizer application. '
                    'Monitor for potential groundwater contamination and leaf burn symptoms.',
        },
        'phosphorus': {
            'Low': 'Apply phosphorus-rich fertilizers like Single Super Phosphate (SSP) or DAP. '
                   'Add bone meal or rock phosphate for organic options.',
            'Normal': 'Phosphorus levels are adequate. Continue with maintenance fertilization.',
            'High': 'Excess phosphorus detected. Reduce phosphorus fertilizer application. '
                    'Avoid further buildup to prevent water pollution.',
        },
        'potassium': {
            'Low': 'Apply potassium fertilizers like Muriate of Potash (MOP) or Sulphate of Potash (SOP). '
                   'Wood ash is a good organic potassium source.',
            'Normal': 'Potassium levels are adequate. Continue with balanced fertilization.',
            'High': 'Excess potassium detected. Reduce potassium fertilizer application. '
                    'High K can interfere with Mg and Ca absorption.',
        },
    }

    def classify_nutrient(self, nutrient_name, value):
        """Classify a nutrient value as Low, Normal, or High."""
        ranges = self.NUTRIENT_RANGES.get(nutrient_name)
        if ranges is None:
            return 'Unknown'

        if value <= ranges['low'][1]:
            return 'Low'
        elif value <= ranges['normal'][1]:
            return 'Normal'
        else:
            return 'High'

    def analyze(self, nitrogen, phosphorus, potassium):
        """
        Full nutrient analysis.
        Returns status, recommendation, and deficiency patterns for N, P, K.
        """
        results = {}

        for name, value in [('nitrogen', nitrogen), ('phosphorus', phosphorus), ('potassium', potassium)]:
            status = self.classify_nutrient(name, value)
            recommendation = self.RECOMMENDATIONS[name][status]
            ranges = self.NUTRIENT_RANGES[name]

            # Calculate percentage within the normal range
            normal_mid = (ranges['normal'][0] + ranges['normal'][1]) / 2
            percentage = min(100, max(0, (value / normal_mid) * 100))

            results[name] = {
                'value': round(value, 2),
                'status': status,
                'recommendation': recommendation,
                'unit': ranges['unit'],
                'full_name': ranges['full_name'],
                'percentage': round(percentage, 1),
                'optimal_range': f"{ranges['normal'][0]}-{ranges['normal'][1]} {ranges['unit']}",
            }

        # Deficiency pattern analysis
        deficient = [n for n, r in results.items() if r['status'] == 'Low']
        excessive = [n for n, r in results.items() if r['status'] == 'High']

        pattern = {
            'deficient_nutrients': deficient,
            'excessive_nutrients': excessive,
            'balanced_nutrients': [n for n, r in results.items() if r['status'] == 'Normal'],
            'overall_assessment': self._get_overall_assessment(deficient, excessive),
        }

        return {
            'nutrients': results,
            'pattern': pattern,
        }

    def _get_overall_assessment(self, deficient, excessive):
        """Generate overall nutrient assessment."""
        if not deficient and not excessive:
            return "All primary nutrients (N, P, K) are within optimal ranges. Soil nutrition is well-balanced."
        elif deficient and not excessive:
            return f"Deficiency detected in {', '.join(deficient).upper()}. Targeted fertilization recommended."
        elif excessive and not deficient:
            return f"Excess levels detected in {', '.join(excessive).upper()}. Reduce application rates."
        else:
            return (f"Imbalanced nutrition: {', '.join(deficient).upper()} deficient, "
                    f"{', '.join(excessive).upper()} excessive. Soil amendment plan needed.")
