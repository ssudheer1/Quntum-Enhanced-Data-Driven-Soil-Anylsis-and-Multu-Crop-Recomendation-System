import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/i18n';

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current * 100) / 100);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return <span ref={ref}>{typeof target === 'number' && target % 1 !== 0 ? count.toFixed(2) : Math.floor(count)}{suffix}</span>;
}

const FEATURES = [
  { icon: 'crop', title: 'Smart Crop Prediction', desc: 'AI-powered recommendation engine analyzes 7 soil & climate parameters to predict the most suitable crop for your land' },
  { icon: 'nutrient', title: 'Nutrient Deficiency Analysis', desc: 'Deep analysis of Nitrogen, Phosphorus, and Potassium levels with actionable fertilizer recommendations' },
  { icon: 'quantum', title: 'Quantum Computing', desc: 'PennyLane quantum circuits with data re-uploading and IQP encoding for next-gen classification' },
  { icon: 'shap', title: 'AI Transparency (SHAP)', desc: 'Understand exactly why a crop was recommended — every prediction comes with feature importance explanations' },
  { icon: 'ensemble', title: 'Stacked Ensemble', desc: '20 ML models (RF, XGBoost, LightGBM, SVM, MLP, LSTM, Quantum, etc.) combined via meta-learner achieving 99.55% accuracy' },
  { icon: 'weather', title: 'Real-time Weather', desc: 'Live temperature, humidity & rainfall data from Open-Meteo automatically fills your climate parameters' },
];

const ICON_MAP = {
  crop: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M12 8c-4 0-7-3-7-6h14c0 3-3 6-7 6zM12 14c-3 0-5-2-5-4h10c0 2-2 4-5 4z"/></svg>,
  nutrient: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3h6l2 4v10a3 3 0 01-3 3h-4a3 3 0 01-3-3V7l2-4z"/><path d="M9 12h6M12 10v4"/></svg>,
  quantum: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4"/></svg>,
  shap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 20h18M6 16v4M10 12v8M14 8v12M18 4v16"/></svg>,
  ensemble: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2"/></svg>,
  weather: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/><circle cx="12" cy="12" r="4"/></svg>,
};

const TECH_STACK = [
  { name: 'AdaBoost', acc: '99.77%', type: 'Boosting' },
  { name: 'Quantum Random Forest', acc: '99.66%', type: 'Quantum' },
  { name: 'Random Forest', acc: '99.55%', type: 'Bagging' },
  { name: 'Extra Trees', acc: '99.55%', type: 'Bagging' },
  { name: 'Naive Bayes', acc: '99.55%', type: 'Probabilistic' },
  { name: 'Voting Ensemble', acc: '99.55%', type: 'Ensemble' },
  { name: 'Stacked Ensemble', acc: '99.55%', type: 'Meta-Learner' },
  { name: 'Bagging Classifier', acc: '99.32%', type: 'Bagging' },
  { name: 'Deep MLP', acc: '99.32%', type: 'Deep Learning' },
  { name: 'MLP+LSTM Hybrid', acc: '99.32%', type: 'Deep Learning' },
  { name: 'XGBoost', acc: '99.09%', type: 'Boosting' },
  { name: 'Gradient Boosting', acc: '99.09%', type: 'Boosting' },
  { name: 'Hist Gradient Boosting', acc: '98.86%', type: 'Boosting' },
  { name: 'LightGBM', acc: '98.86%', type: 'Boosting' },
  { name: 'SVM (RBF)', acc: '98.86%', type: 'Kernel' },
  { name: 'MLP Neural Network', acc: '98.86%', type: 'Deep Learning' },
  { name: 'KNN', acc: '98.18%', type: 'Instance' },
  { name: 'Decision Tree', acc: '97.95%', type: 'Tree' },
  { name: 'Logistic Regression', acc: '97.95%', type: 'Linear' },
  { name: 'LSTM-Tabular', acc: '97.95%', type: 'Deep Learning' },
  { name: 'Quantum Hybrid SVM', acc: '97.27%', type: 'Quantum' },
];

export default function LandingPage({ onGetStarted }) {
  const { t } = useLanguage();

  return (
    <div className="landing">
      {/* ─── Navbar ─── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="nav-brand">
            <div className="nav-logo">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#16a34a"/>
                <path d="M16 6 C16 6 20 12 20 18 C20 22 18 26 16 26 C14 26 12 22 12 18 C12 12 16 6 16 6Z" fill="white" opacity="0.9"/>
                <path d="M16 14 C12 10 8 12 8 16 C8 18 10 19 12 18 C14 17 15 15 16 14Z" fill="white" opacity="0.7"/>
                <path d="M16 14 C20 10 24 12 24 16 C24 18 22 19 20 18 C18 17 17 15 16 14Z" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <span className="nav-brand-text">QuantumSoil</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#technology">Technology</a>
            <a href="#how">How It Works</a>
          </div>
          <button className="btn-nav-cta" onClick={onGetStarted}>Get Started</button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero-bg-pattern"></div>
        <div className="hero-grid-overlay"></div>
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>

        <div className="hero-body">
          <div className="hero-text">
            <div className="hero-chip">
              <span className="chip-dot"></span>
              Powered by Quantum Computing & Machine Learning
            </div>
            <h1>
              Quantum-Enhanced<br/>
              <span className="hero-highlight">Soil Nutrient Analysis</span><br/>
              & Multi-Crop Recommendation
            </h1>
            <p className="hero-desc">
              Leverage cutting-edge AI with 20 machine learning models, quantum computing, 
              and SHAP explainability to make precision agriculture decisions.
            </p>
            <div className="hero-btns">
              <button className="btn-hero" onClick={onGetStarted}>
                Start Analyzing
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button className="btn-hero-outline" onClick={onGetStarted}>
                Try as Guest
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-float-card hfc-1">
                <div className="hfc-icon hfc-green">N</div>
                <div><div className="hfc-label">Nitrogen</div><div className="hfc-value">90 mg/kg</div></div>
              </div>
              <div className="hero-float-card hfc-2">
                <div className="hfc-icon hfc-blue">P</div>
                <div><div className="hfc-label">Phosphorus</div><div className="hfc-value">42 mg/kg</div></div>
              </div>
              <div className="hero-float-card hfc-3">
                <div className="hfc-icon hfc-amber">K</div>
                <div><div className="hfc-label">Potassium</div><div className="hfc-value">43 mg/kg</div></div>
              </div>
              <div className="hero-result-card">
                <div className="hrc-header">Prediction Result</div>
                <div className="hrc-crop">Rice</div>
                <div className="hrc-conf">
                  <div className="hrc-bar"><div className="hrc-bar-fill" style={{width:'99%'}}></div></div>
                  <span>99.5%</span>
                </div>
                <div className="hrc-models">
                  <span className="hrc-tag">Random Forest</span>
                  <span className="hrc-tag">XGBoost</span>
                  <span className="hrc-tag">+4 more</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="stats-strip">
          <div className="stat-item">
            <div className="stat-number"><AnimatedCounter target={99.55} suffix="%" /></div>
            <div className="stat-text">Model Accuracy</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number"><AnimatedCounter target={22} /></div>
            <div className="stat-text">Crop Types</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number"><AnimatedCounter target={6} /></div>
            <div className="stat-text">ML Models</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number"><AnimatedCounter target={7} /></div>
            <div className="stat-text">Input Parameters</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number"><AnimatedCounter target={4} /></div>
            <div className="stat-text">Quantum Qubits</div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="section-features" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Core Capabilities</span>
            <h2>Everything you need for<br/>precision agriculture</h2>
            <p>Our system combines classical ML, quantum computing, and real-time data for comprehensive soil analysis</p>
          </div>
          <div className="features-grid-complex">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`feature-complex-card ${i === 0 ? 'featured' : ''}`}>
                <div className="fcc-icon-wrap">
                  {ICON_MAP[f.icon]}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="fcc-number">{String(i + 1).padStart(2, '0')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Technology ─── */}
      <section className="section-tech" id="technology">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Model Architecture</span>
            <h2>20 ML Models Working Together</h2>
            <p>Each model brings unique strengths — combined via stacking for maximum accuracy</p>
          </div>
          <div className="tech-grid">
            {TECH_STACK.map((m, i) => (
              <div key={m.name} className={`tech-card ${i === 4 ? 'tech-best' : ''} ${i === 5 ? 'tech-quantum' : ''}`}>
                <div className="tech-rank">#{i + 1}</div>
                <h4>{m.name}</h4>
                <div className="tech-type">{m.type}</div>
                <div className="tech-acc">{m.acc}</div>
                <div className="tech-bar">
                  <div className="tech-bar-fill" style={{ width: m.acc }}></div>
                </div>
                {i === 4 && <div className="tech-badge">Best</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="section-how" id="how">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Workflow</span>
            <h2>How It Works</h2>
          </div>
          <div className="how-timeline">
            <div className="how-line"></div>
            {[
              { step: '01', title: 'Input Soil Data', desc: 'Enter N, P, K, pH, temperature, humidity, and rainfall values from your soil test report' },
              { step: '02', title: 'AI Processing', desc: '20 ML models including 2 quantum models analyze your data simultaneously using stacked ensemble architecture' },
              { step: '03', title: 'Get Prediction', desc: 'Receive the best crop recommendation with confidence score, SHAP explanation, and nutrient analysis' },
              { step: '04', title: 'Take Action', desc: 'View nutrient deficiency patterns, soil health score, and actionable insights to maximize your yield' },
            ].map(s => (
              <div key={s.step} className="how-step">
                <div className="how-step-num">{s.step}</div>
                <div className="how-step-content">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="section-cta">
        <div className="section-container">
          <div className="cta-box">
            <h2>Ready to optimize your crop selection?</h2>
            <p>Join farmers who use quantum-enhanced AI for precision agriculture decisions</p>
            <div className="cta-btns">
              <button className="btn-hero" onClick={onGetStarted}>
                Start Free Analysis
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-ft">
        <div className="section-container">
          <div className="ft-grid">
            <div className="ft-brand">
              <div className="nav-brand">
                <div className="nav-logo">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="#16a34a"/>
                    <path d="M16 6C16 6 20 12 20 18C20 22 18 26 16 26C14 26 12 22 12 18C12 12 16 6 16 6Z" fill="white" opacity="0.9"/>
                  </svg>
                </div>
                <span className="nav-brand-text">QuantumSoil</span>
              </div>
              <p>Quantum-Enhanced Soil Nutrient Analysis & Multi-Crop Recommendation System</p>
            </div>
            <div className="ft-col">
              <h5>Technology</h5>
              <ul>
                <li>Random Forest</li>
                <li>XGBoost & LightGBM</li>
                <li>Stacked Ensemble</li>
                <li>PennyLane Quantum</li>
              </ul>
            </div>
            <div className="ft-col">
              <h5>Features</h5>
              <ul>
                <li>Crop Prediction</li>
                <li>Nutrient Analysis</li>
                <li>SHAP Explainability</li>
                <li>Weather Integration</li>
              </ul>
            </div>
          </div>
          <div className="ft-bottom">
            <p>{t('footerText')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
