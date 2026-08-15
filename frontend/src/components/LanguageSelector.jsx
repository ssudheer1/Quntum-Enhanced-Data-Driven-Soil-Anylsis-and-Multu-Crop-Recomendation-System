import { useLanguage } from '../i18n/i18n';

const LANGS = [
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'te', label: 'తె', flag: '🇮🇳', name: 'తెలుగు' },
  { code: 'hi', label: 'हि', flag: '🇮🇳', name: 'हिन्दी' },
];

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-selector">
      {LANGS.map(l => (
        <button
          key={l.code}
          className={`lang-btn ${lang === l.code ? 'active' : ''}`}
          onClick={() => setLang(l.code)}
          title={l.name}
        >
          <span className="lang-flag">{l.flag}</span>
          <span className="lang-code">{l.label}</span>
        </button>
      ))}
    </div>
  );
}
