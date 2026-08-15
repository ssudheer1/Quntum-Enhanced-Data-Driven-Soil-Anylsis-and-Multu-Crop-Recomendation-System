import { useLanguage } from '../i18n/i18n';
import LanguageSelector from './LanguageSelector';
import { isAuthenticated, getUser } from '../services/authService';

export default function Header({ onLogout }) {
  const { t } = useLanguage();
  const user = getUser();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <div className="header-logo">
            <div className="logo-mark">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#logoGrad)"/>
                <path d="M16 6 C16 6 20 12 20 18 C20 22 18 26 16 26 C14 26 12 22 12 18 C12 12 16 6 16 6Z" fill="white" opacity="0.9"/>
                <path d="M16 14 C12 10 8 12 8 16 C8 18 10 19 12 18 C14 17 15 15 16 14Z" fill="white" opacity="0.7"/>
                <path d="M16 14 C20 10 24 12 24 16 C24 18 22 19 20 18 C18 17 17 15 16 14Z" fill="white" opacity="0.7"/>
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#16a34a"/>
                    <stop offset="1" stopColor="#15803d"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h1 className="header-title">{t('appTitle')}</h1>
              <p className="header-subtitle">{t('appSubtitle')}</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <LanguageSelector />

          {isAuthenticated() && user && (
            <div className="header-user">
              <div className="user-avatar-circle">
                {(user.first_name || user.username || 'F')[0].toUpperCase()}
              </div>
              <span className="user-name">{user.first_name || user.username}</span>
              <button className="btn-logout" onClick={onLogout} title={t('logout')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
