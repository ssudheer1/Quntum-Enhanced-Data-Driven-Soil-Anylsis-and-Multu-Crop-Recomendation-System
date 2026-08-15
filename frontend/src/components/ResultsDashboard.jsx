import { useLanguage } from '../i18n/i18n';
import NutrientGauge from './NutrientGauge';
import SoilHealthMeter from './SoilHealthMeter';
import ShapChart from './ShapChart';

const CROP_EMOJIS = {
  rice: '🌾', wheat: '🌾', maize: '🌽', chickpea: '🫘', kidneybeans: '🫘',
  pigeonpeas: '🫘', mothbeans: '🫘', mungbean: '🫘', blackgram: '🫘',
  lentil: '🫘', pomegranate: '🍎', banana: '🍌', mango: '🥭', grapes: '🍇',
  watermelon: '🍉', muskmelon: '🍈', apple: '🍎', orange: '🍊',
  papaya: '🫒', coconut: '🥥', cotton: '🌿', jute: '🌿', coffee: '☕',
};

export default function ResultsDashboard({ results }) {
  const { t } = useLanguage();

  if (!results) return null;

  const {
    recommended_crop, confidence, top_3_crops,
    nutrient_analysis, soil_health, shap_explanation, quantum_comparison,
  } = results;

  const emoji = CROP_EMOJIS[recommended_crop] || '🌱';

  return (
    <div className="results-dashboard animate-fade-in-up">
      {/* Hero — Recommended Crop */}
      <div className="crop-result-hero">
        <div className="crop-emoji">{emoji}</div>
        <div className="crop-info">
          <h2>{recommended_crop}</h2>
          <p className="crop-confidence">
            {t('recommendedCrop')} — {(confidence * 100).toFixed(1)}% {t('confidence')}
          </p>
          {top_3_crops && (
            <div className="top-crops-list">
              {top_3_crops.map((c, i) => (
                <span key={c.crop} className="top-crop-chip">
                  #{i + 1} {CROP_EMOJIS[c.crop] || '🌱'} {c.crop} ({(c.probability * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nutrient Gauges */}
      {nutrient_analysis?.nutrients && (
        <div className="glass-card nutrient-section">
          <h3>🧪 {t('nutrientAnalysis')}</h3>
          <div className="nutrient-gauges">
            {Object.entries(nutrient_analysis.nutrients).map(([key, data]) => (
              <NutrientGauge key={key} name={key} data={data} />
            ))}
          </div>
        </div>
      )}

      {/* Soil Health + SHAP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card soil-health-section">
          <h3>❤️ {t('soilHealthScore')}</h3>
          <SoilHealthMeter data={soil_health} />
        </div>
        <div className="glass-card shap-section">
          <h3>🔍 {t('shapExplain')}</h3>
          <ShapChart data={shap_explanation} />
        </div>
      </div>

      {/* Quantum vs Classical */}
      {quantum_comparison && (quantum_comparison.quantum_accuracy || quantum_comparison.classical_accuracy) && (
        <div className="glass-card quantum-section">
          <h3>⚛️ {t('quantumVsClassical')}</h3>
          <div className="quantum-compare-grid">
            {quantum_comparison.classical_accuracy > 0 && (
              <div className="compare-card classical">
                <div className="compare-label">🤖 {t('classicalEnsemble')}</div>
                <div className="compare-value">{(quantum_comparison.classical_accuracy * 100).toFixed(1)}%</div>
              </div>
            )}
            {quantum_comparison.quantum_accuracy > 0 && (
              <div className="compare-card quantum">
                <div className="compare-label">⚛️ {t('quantumML')} ({quantum_comparison.n_qubits || 4} {t('qubits')})</div>
                <div className="compare-value">{(quantum_comparison.quantum_accuracy * 100).toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nutrient Deficiency Pattern */}
      {nutrient_analysis?.pattern && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--green-800)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 {t('deficiencyPattern')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '12px' }}>
            {nutrient_analysis.pattern.overall_assessment}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {nutrient_analysis.pattern.deficient_nutrients?.map(n => (
              <span key={n} className="gauge-status low">⚠️ {n} {t('low')}</span>
            ))}
            {nutrient_analysis.pattern.balanced_nutrients?.map(n => (
              <span key={n} className="gauge-status normal">✓ {n} {t('normal')}</span>
            ))}
            {nutrient_analysis.pattern.excessive_nutrients?.map(n => (
              <span key={n} className="gauge-status high">⬆ {n} {t('high')}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
