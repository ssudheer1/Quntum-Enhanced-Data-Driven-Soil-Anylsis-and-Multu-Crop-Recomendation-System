import { useLanguage } from '../i18n/i18n';

const IMPACT_LABELS = {
  en: { High: 'High', Medium: 'Medium', Low: 'Low' },
  te: { High: 'ఎక్కువ', Medium: 'మధ్యస్థం', Low: 'తక్కువ' },
  hi: { High: 'अधिक', Medium: 'मध्यम', Low: 'कम' },
};

export default function ShapChart({ data }) {
  const { lang } = useLanguage();
  if (!data || data.length === 0) return null;

  const maxImpact = Math.max(...data.map(d => d.abs_impact), 0.01);
  const labels = IMPACT_LABELS[lang] || IMPACT_LABELS.en;

  return (
    <div>
      <div className="shap-bar-container">
        {data.map((item, idx) => (
          <div className="shap-bar-item" key={item.feature} style={{ animationDelay: `${idx * 0.1}s` }}>
            <span className="shap-feature-name">{item.feature}</span>
            <div className="shap-bar-track">
              <div 
                className={`shap-bar-fill ${item.impact_level.toLowerCase()}`}
                style={{ width: `${(item.abs_impact / maxImpact) * 100}%` }}
              >
                {item.shap_value.toFixed(3)}
              </div>
            </div>
            <span className={`shap-impact-badge badge badge-${item.impact_level === 'High' ? 'high' : item.impact_level === 'Medium' ? 'normal' : 'low'}`}>
              {labels[item.impact_level] || item.impact_level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
