export default function SoilHealthMeter({ data }) {
  if (!data) return null;

  const { score, grade, interpretation, breakdown } = data;

  const getColor = (s) => {
    if (s >= 85) return '#10b981';
    if (s >= 70) return '#34d399';
    if (s >= 55) return '#fbbf24';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(score);

  return (
    <div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px 0', gap: '8px',
      }}>
        <div style={{
          width: '120px', height: '120px', borderRadius: '50%',
          border: `6px solid ${color}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `${color}15`,
        }}>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color }}>{score}</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ 100</span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color, marginTop: '8px' }}>{grade}</div>
        <p style={{ fontSize: '0.88rem', color: '#64748b', textAlign: 'center', maxWidth: '300px' }}>
          {interpretation}
        </p>
      </div>

      {breakdown && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {Object.entries(breakdown).map(([param, info]) => (
            <div key={param} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ minWidth: '90px', fontSize: '0.82rem', color: '#64748b', textTransform: 'capitalize' }}>
                {param}
              </span>
              <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${info.score}%`, height: '100%', borderRadius: '4px',
                  background: info.in_range ? '#16a34a' : info.score > 50 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.8s ease',
                }}></div>
              </div>
              <span style={{ minWidth: '40px', fontSize: '0.82rem', fontWeight: 600, textAlign: 'right' }}>
                {info.score}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
