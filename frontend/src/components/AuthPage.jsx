import { useState } from 'react';
import { useLanguage } from '../i18n/i18n';
import LanguageSelector from './LanguageSelector';
import {
  signupSendOTP, signupVerifyOTP,
  loginSendOTP, loginVerifyOTP,
  loginWithPassword,
} from '../services/authService';

const STEPS = {
  CHOOSE: 'choose',       // Choose signup or login
  SIGNUP_FORM: 'signup',   // Fill signup details
  SIGNUP_OTP: 'signup_otp',// Verify signup OTP
  LOGIN_EMAIL: 'login',    // Enter email for login
  LOGIN_OTP: 'login_otp',  // Verify login OTP
  LOGIN_PW: 'login_pw',    // Password login fallback
};

export default function AuthPage({ onAuthSuccess }) {
  const { t } = useLanguage();

  const [step, setStep] = useState(STEPS.CHOOSE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugOTP, setDebugOTP] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [language, setLanguage] = useState('en');

  function clearMessages() { setError(''); setSuccess(''); }

  // ── SIGNUP: Send OTP ──
  async function handleSignupSendOTP(e) {
    e.preventDefault();
    clearMessages();
    if (!email || !firstName || !password) {
      setError('Please fill all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await signupSendOTP(email, firstName, lastName);
      setSuccess(`OTP sent to ${email}! Check your email.`);
      if (res.otp_debug) setDebugOTP(res.otp_debug);
      setStep(STEPS.SIGNUP_OTP);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  // ── SIGNUP: Verify OTP ──
  async function handleSignupVerify(e) {
    e.preventDefault();
    clearMessages();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await signupVerifyOTP({
        email, otp, firstName, lastName, phone, password,
        preferredLanguage: language,
      });
      onAuthSuccess(res);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  // ── LOGIN: Send OTP ──
  async function handleLoginSendOTP(e) {
    e.preventDefault();
    clearMessages();
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await loginSendOTP(email);
      setSuccess(`OTP sent to ${email}! Check your email.`);
      if (res.otp_debug) setDebugOTP(res.otp_debug);
      setStep(STEPS.LOGIN_OTP);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  // ── LOGIN: Verify OTP ──
  async function handleLoginVerify(e) {
    e.preventDefault();
    clearMessages();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await loginVerifyOTP(email, otp);
      onAuthSuccess(res);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  // ── PASSWORD LOGIN ──
  async function handlePasswordLogin(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await loginWithPassword(email, password);
      onAuthSuccess(res);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  // ── Guest ──
  function handleGuest() {
    onAuthSuccess({ user: { first_name: 'Guest', username: 'guest' } });
  }

  // ── Resend OTP ──
  async function handleResend() {
    clearMessages();
    setLoading(true);
    try {
      const purpose = step === STEPS.SIGNUP_OTP ? 'signup' : 'login';
      const res = purpose === 'signup'
        ? await signupSendOTP(email, firstName, lastName)
        : await loginSendOTP(email);
      setSuccess('New OTP sent!');
      if (res.otp_debug) setDebugOTP(res.otp_debug);
      setOtp('');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Logo */}
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#16a34a"/>
              <path d="M16 6C16 6 20 12 20 18C20 22 18 26 16 26C14 26 12 22 12 18C12 12 16 6 16 6Z" fill="white" opacity="0.9"/>
              <path d="M16 14C12 10 8 12 8 16C8 18 10 19 12 18C14 17 15 15 16 14Z" fill="white" opacity="0.7"/>
              <path d="M16 14C20 10 24 12 24 16C24 18 22 19 20 18C18 17 17 15 16 14Z" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <h1>QuantumSoil</h1>
          <p>{step.includes('signup') ? 'Create your farmer account' : 'Welcome back, farmer'}</p>
        </div>

        {/* Error / Success */}
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-otp-demo" style={{ borderColor: 'var(--green-300)' }}>{success}</div>}




        {/* ── Step: Choose ── */}
        {step === STEPS.CHOOSE && (
          <div className="auth-choose">
            <button className="btn-auth-choice" onClick={() => { clearMessages(); setStep(STEPS.SIGNUP_FORM); }}>
              <div className="choice-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="16" y1="11" x2="22" y2="11"/>
                </svg>
              </div>
              <div>
                <strong>Sign Up</strong>
                <span>Create a new farmer account</span>
              </div>
            </button>
            <button className="btn-auth-choice" onClick={() => { clearMessages(); setStep(STEPS.LOGIN_EMAIL); }}>
              <div className="choice-icon login">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <div>
                <strong>Login</strong>
                <span>Sign in to your existing account</span>
              </div>
            </button>

            <div className="auth-divider"><span>or</span></div>
            <button className="btn-secondary auth-guest" onClick={handleGuest}>
              Continue as Guest
            </button>
          </div>
        )}

        {/* ── Step: Signup Form ── */}
        {step === STEPS.SIGNUP_FORM && (
          <form className="auth-form" onSubmit={handleSignupSendOTP}>
            <div className="auth-field">
              <label>Email Address *</label>
              <input className="input-field" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="farmer@example.com" required />
            </div>
            <div className="auth-row">
              <div className="auth-field">
                <label>First Name *</label>
                <input className="input-field" type="text" value={firstName}
                  onChange={e => setFirstName(e.target.value)} placeholder="Raju" required />
              </div>
              <div className="auth-field">
                <label>Last Name</label>
                <input className="input-field" type="text" value={lastName}
                  onChange={e => setLastName(e.target.value)} placeholder="Kumar" />
              </div>
            </div>
            <div className="auth-field">
              <label>Phone Number</label>
              <input className="input-field" type="tel" value={phone}
                onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="auth-field">
              <label>Password * (min 6 chars)</label>
              <input className="input-field" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Create a password" required minLength={6} />
            </div>
            <div className="auth-field">
              <label>Preferred Language</label>
              <select className="input-field" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="te">Telugu</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <button className="btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <><span className="spinner"></span> Sending OTP...</> : 'Send OTP to Email'}
            </button>
            <button type="button" className="btn-link" onClick={() => { clearMessages(); setStep(STEPS.CHOOSE); }}>
              Back
            </button>
          </form>
        )}

        {/* ── Step: Signup OTP Verify ── */}
        {step === STEPS.SIGNUP_OTP && (
          <form className="auth-form" onSubmit={handleSignupVerify}>
            <p className="auth-otp-info">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <div className="auth-field">
              <label>OTP Code</label>
              <input className="input-field otp-input" type="text" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} required
                style={{ fontSize: '1.6rem', letterSpacing: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }} />
            </div>
            <button className="btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <><span className="spinner"></span> Verifying...</> : 'Verify & Create Account'}
            </button>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-link" onClick={handleResend} disabled={loading}>
                Resend OTP
              </button>
              <button type="button" className="btn-link" onClick={() => { clearMessages(); setDebugOTP(''); setOtp(''); setStep(STEPS.SIGNUP_FORM); }}>
                Back
              </button>
            </div>
          </form>
        )}

        {/* ── Step: Login Email ── */}
        {step === STEPS.LOGIN_EMAIL && (
          <form className="auth-form" onSubmit={handleLoginSendOTP}>
            <div className="auth-field">
              <label>Email Address</label>
              <input className="input-field" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="farmer@example.com" required />
            </div>
            <button className="btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <><span className="spinner"></span> Sending OTP...</> : 'Send Login OTP'}
            </button>

            <div className="auth-divider"><span>or</span></div>
            <button type="button" className="btn-secondary" style={{ width: '100%' }}
              onClick={() => { clearMessages(); setStep(STEPS.LOGIN_PW); }}>
              Login with Password
            </button>

            <button type="button" className="btn-link" onClick={() => { clearMessages(); setStep(STEPS.CHOOSE); }}>
              Back
            </button>
          </form>
        )}

        {/* ── Step: Login OTP Verify ── */}
        {step === STEPS.LOGIN_OTP && (
          <form className="auth-form" onSubmit={handleLoginVerify}>
            <p className="auth-otp-info">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <div className="auth-field">
              <label>OTP Code</label>
              <input className="input-field otp-input" type="text" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} required
                style={{ fontSize: '1.6rem', letterSpacing: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }} />
            </div>
            <button className="btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <><span className="spinner"></span> Verifying...</> : 'Verify & Login'}
            </button>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-link" onClick={handleResend} disabled={loading}>
                Resend OTP
              </button>
              <button type="button" className="btn-link" onClick={() => { clearMessages(); setDebugOTP(''); setOtp(''); setStep(STEPS.LOGIN_EMAIL); }}>
                Back
              </button>
            </div>
          </form>
        )}

        {/* ── Step: Password Login ── */}
        {step === STEPS.LOGIN_PW && (
          <form className="auth-form" onSubmit={handlePasswordLogin}>
            <div className="auth-field">
              <label>Username or Email</label>
              <input className="input-field" type="text" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="Username" required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input className="input-field" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Password" required />
            </div>
            <button className="btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <><span className="spinner"></span> Logging in...</> : 'Login'}
            </button>
            <button type="button" className="btn-link" onClick={() => { clearMessages(); setStep(STEPS.LOGIN_EMAIL); }}>
              Back to OTP Login
            </button>
          </form>
        )}

        {/* Language Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
}
