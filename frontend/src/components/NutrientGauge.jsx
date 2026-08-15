import { useLanguage } from '../i18n/i18n';

const STATUS_LABELS = {
  en: { High: 'High', Normal: 'Normal', Low: 'Low' },
  te: { High: 'ఎక్కువ', Normal: 'సాధారణం', Low: 'తక్కువ' },
  hi: { High: 'अधिक', Normal: 'सामान्य', Low: 'कम' },
};

const OPTIMAL_LABEL = { en: 'Optimal', te: 'సరైన', hi: 'इष्टतम' };

export default function NutrientGauge({ name, data }) {
  const { lang } = useLanguage();
  if (!data) return null;

  const statusClass = data.status.toLowerCase();
  const fillWidth = Math.min(100, data.percentage || 50);
  const labels = STATUS_LABELS[lang] || STATUS_LABELS.en;
  const optLabel = OPTIMAL_LABEL[lang] || OPTIMAL_LABEL.en;
  
  return (
    <div className="glass-card nutrient-card">
      <div className="nutrient-header">
        <span className="nutrient-name">{data.full_name}</span>
        <span className={`badge badge-${statusClass}`}>{labels[data.status] || data.status}</span>
      </div>
      <div className="nutrient-value">{data.value} <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{data.unit}</span></div>
      
      <div className="nutrient-bar-wrap">
        <div className="nutrient-bar-track">
          <div 
            className={`nutrient-bar-fill ${statusClass}`}
            style={{ width: `${fillWidth}%` }}
          ></div>
        </div>
        <div className="nutrient-range">
          <span>0</span>
          <span>{optLabel}: {data.optimal_range}</span>
        </div>
      </div>

      <div className="nutrient-recommendation">
        💡 {data.recommendation}
      </div>
    </div>
  );
}
