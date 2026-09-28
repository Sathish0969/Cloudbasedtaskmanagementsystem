import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Check, User, ShieldCheck } from 'lucide-react';

export default function AuthLogin({ role, initialMode = 'login', onBack, onLoginSuccess }) {
  const isManager = role === 'manager';
  const isTL = role === 'teamleader';
  const isEmployee = role === 'employee';

  const roleDisplayName = isTL ? 'Team Leader (TL)' : isManager ? 'Manager' : 'Employee';
  
  // Login or register
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'create-account'
  const isRegister = authMode === 'create-account';

  const [fullName, setFullName] = useState(isRegister ? '' : 'Sabarinathan V');
  const [email, setEmail] = useState(
    isTL 
      ? 'sabarinathan.tl@taskflow.cloud' 
      : isManager 
      ? 'sabarinathan.mgr@taskflow.cloud' 
      : 'sabarinathan.emp@taskflow.cloud'
  );
  const [password, setPassword] = useState('••••••••••••');
  const [confirmPassword, setConfirmPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (isRegister) {
      if (!fullName.trim()) {
        setFormError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess({
        role,
        name: fullName.trim() || 'Sabarinathan V',
        email,
        title: isTL ? 'Team Leader / Technical Lead' : isManager ? 'Engineering Manager' : 'Senior Cloud Engineer'
      });
    }, 400);
  };

  return (
    <div className={`tf-login-page tf-theme-${role}`}>
      {/* Top Header */}
      <header className="tf-login-header">
        <div className="tf-login-brand-group">
          <div className="tf-brand">
            <div className={`tf-logo-icon ${isTL ? 'tf-indigo-bg' : isManager ? 'tf-terracotta-bg' : 'tf-green-bg'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="tf-brand-name">Task Management</span>
          </div>
          <span className="tf-brand-slogan">Plan • Track • Achieve</span>
        </div>

        <button className="tf-back-link" onClick={onBack} type="button">
          <ArrowLeft size={16} />
          <span>Back to Role Selection</span>
        </button>
      </header>

      {/* Main Login Form Container */}
      <main className="tf-login-main">
        <div className="tf-login-content">
          <div className="tf-login-titles">
            <h1 className="tf-login-heading">
              <span className={isTL ? 'tf-text-indigo' : isManager ? 'tf-text-terracotta' : 'tf-text-green'}>
                {roleDisplayName}
              </span>{' '}
              {isRegister ? 'Create Account' : 'Login'}
            </h1>
            <p className="tf-login-subtitle">
              {isRegister
                ? (isTL
                  ? 'Register your Team Leader account to orchestrate sprints and assign tasks.'
                  : isManager
                  ? 'Register your manager account to oversee projects and teams.'
                  : 'Create your employee account to view tasks and track progress.')
                : (isTL
                  ? 'Authorize and assign sprint deliverables from manager to employees.'
                  : isManager
                  ? 'Manage your team, track sprint progress and review deliverables.'
                  : 'View your tasks, update progress and achieve goals.')}
            </p>
          </div>

          <div className="tf-login-card">
            {/* Mode Switcher Tabs */}
            <div className="tf-auth-tabs">
              <button
                type="button"
                className={`tf-auth-tab-btn ${!isRegister ? 'tf-auth-tab-active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setFormError('');
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`tf-auth-tab-btn ${isRegister ? 'tf-auth-tab-active' : ''}`}
                onClick={() => {
                  setAuthMode('create-account');
                  setFormError('');
                  if (fullName === 'Sabarinathan V') setFullName('');
                  if (password === '••••••••••••') {
                    setPassword('');
                    setConfirmPassword('');
                  }
                }}
              >
                Create Account
              </button>
            </div>

            {formError && (
              <div className="tf-form-error-banner">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="tf-login-form">
              {/* Full Name Field (Register Mode Only) */}
              {isRegister && (
                <div className="tf-form-group">
                  <label htmlFor="register-name" className="tf-label">Full Name</label>
                  <div className="tf-input-wrapper">
                    <User className="tf-input-icon" size={18} />
                    <input
                      id="register-name"
                      type="text"
                      className="tf-input"
                      placeholder="e.g., Sabarinathan V"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="tf-form-group">
                <label htmlFor="login-email" className="tf-label">Email address</label>
                <div className="tf-input-wrapper">
                  <Mail className="tf-input-icon" size={18} />
                  <input
                    id="login-email"
                    type="email"
                    className="tf-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="tf-form-group">
                <label htmlFor="login-password" className="tf-label">Password</label>
                <div className="tf-input-wrapper">
                  <Lock className="tf-input-icon" size={18} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="tf-input tf-input-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="tf-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register Mode Only) */}
              {isRegister && (
                <div className="tf-form-group">
                  <label htmlFor="register-confirm-password" className="tf-label">Confirm Password</label>
                  <div className="tf-input-wrapper">
                    <Lock className="tf-input-icon" size={18} />
                    <input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      className="tf-input"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Options Row (Remember me / Forgot password) */}
              {!isRegister && (
                <div className="tf-login-options">
                  <label className="tf-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="tf-hidden-checkbox"
                    />
                    <span className={`tf-custom-checkbox ${rememberMe ? (isTL ? 'tf-cb-teamleader' : isManager ? 'tf-cb-manager' : 'tf-cb-employee') : ''}`}>
                      {rememberMe && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="tf-checkbox-text">Remember me</span>
                  </label>

                  <button
                    type="button"
                    className={`tf-forgot-btn ${isTL ? 'tf-link-indigo' : isManager ? 'tf-link-terracotta' : 'tf-link-green'}`}
                    onClick={() => alert('Password reset link sent to your registered company email.')}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={`tf-btn-submit ${isTL ? 'tf-btn-teamleader' : isManager ? 'tf-btn-manager' : 'tf-btn-employee'}`}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (isRegister ? 'Creating Account...' : 'Logging in...')
                  : (isRegister ? 'Create Account' : 'Login')}
              </button>

              {/* Toggle mode helper at bottom */}
              <div className="tf-auth-toggle-footer">
                {isRegister ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className={`tf-auth-switch-link ${isTL ? 'tf-link-indigo' : isManager ? 'tf-link-terracotta' : 'tf-link-green'}`}
                      onClick={() => {
                        setAuthMode('login');
                        setFormError('');
                      }}
                    >
                      Log in here
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className={`tf-auth-switch-link ${isTL ? 'tf-link-indigo' : isManager ? 'tf-link-terracotta' : 'tf-link-green'}`}
                      onClick={() => {
                        setAuthMode('create-account');
                        setFormError('');
                        if (fullName === 'Sabarinathan V') setFullName('');
                        if (password === '••••••••••••') {
                          setPassword('');
                          setConfirmPassword('');
                        }
                      }}
                    >
                      Create an account
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Illustrated Workspace Scene (Custom Pixel-Perfect SVG) */}
        <div className="tf-login-illustration-container">
          {isTL ? (
            /* Team Leader Orchestration & Assignment Scene */
            <div className="tf-illustration-wrapper tf-teamleader-scene">
              <div className="tf-calligraphy tf-tl-calligraphy">
                <span>Authorize</span>
                <span className="tf-arrow-down">↘</span>
                <span>Assign</span>
                <span className="tf-arrow-down">↘</span>
                <span>Empower</span>
              </div>

              <div className="tf-scene-svg-wrap">
                <svg viewBox="0 0 520 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="tf-scene-svg">
                  {/* Soft indigo background blob */}
                  <path d="M40 120 C110 50, 310 40, 490 100 C520 170, 390 200, 190 200 Z" fill="#EEF2FF" opacity="0.8" />

                  {/* Desk Surface */}
                  <rect x="25" y="160" width="470" height="12" rx="4" fill="#3B82F6" />
                  <rect x="40" y="172" width="16" height="28" fill="#1E293B" />
                  <rect x="464" y="172" width="16" height="28" fill="#1E293B" />

                  {/* Manager Requests Queue Card (Source) */}
                  <g transform="translate(60, 60)">
                    <rect width="105" height="88" rx="8" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.06))" stroke="#E0E7FF" />
                    <rect x="10" y="12" width="85" height="16" rx="4" fill="#F1F5F9" />
                    <text x="14" y="24" fill="#475569" fontSize="8" fontWeight="700">Manager Sprints</text>
                    <rect x="10" y="36" width="60" height="8" rx="2" fill="#93C5FD" />
                    <rect x="10" y="50" width="75" height="8" rx="2" fill="#BFDBFE" />
                    <rect x="10" y="64" width="50" height="8" rx="2" fill="#E2E8F0" />
                    <circle cx="85" cy="74" r="8" fill="#2563EB" />
                    <text x="82" y="77" fill="#FFFFFF" fontSize="9" fontWeight="bold">→</text>
                  </g>

                  {/* TL Assignment Console (Center Active Hub) */}
                  <g transform="translate(190, 40)">
                    <rect width="130" height="112" rx="10" fill="#FFFFFF" filter="drop-shadow(0 6px 16px rgba(37,99,235,0.12))" stroke="#93C5FD" strokeWidth="1.5" />
                    <rect x="10" y="10" width="110" height="20" rx="4" fill="#EFF6FF" />
                    <text x="16" y="24" fill="#1D4ED8" fontSize="9" fontWeight="700">🛡️ TL Assign Console</text>
                    <rect x="12" y="38" width="106" height="16" rx="3" fill="#F8FAFC" stroke="#E2E8F0" />
                    <text x="18" y="49" fill="#334155" fontSize="7.5" fontWeight="600">Assign: Deploy DynamoDB</text>
                    <rect x="12" y="60" width="106" height="16" rx="3" fill="#F8FAFC" stroke="#E2E8F0" />
                    <text x="18" y="71" fill="#334155" fontSize="7.5" fontWeight="600">Assignee: Arun K (Lead)</text>
                    <rect x="12" y="82" width="106" height="20" rx="5" fill="#2563EB" />
                    <text x="34" y="95" fill="#FFFFFF" fontSize="8.5" fontWeight="700">✓ Assign to Sprint</text>
                  </g>

                  {/* Delegated Team Members List Card (Right) */}
                  <g transform="translate(345, 65)">
                    <rect width="105" height="84" rx="8" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.06))" stroke="#E0E7FF" />
                    <text x="12" y="18" fill="#475569" fontSize="8.5" fontWeight="700">Team Members</text>
                    <circle cx="20" cy="34" r="8" fill="#3B82F6" />
                    <rect x="34" y="30" width="55" height="7" rx="2" fill="#CBD5E1" />
                    <circle cx="20" cy="52" r="8" fill="#10B981" />
                    <rect x="34" y="48" width="45" height="7" rx="2" fill="#CBD5E1" />
                    <circle cx="20" cy="70" r="8" fill="#F59E0B" />
                    <rect x="34" y="66" width="50" height="7" rx="2" fill="#CBD5E1" />
                  </g>
                </svg>
              </div>
            </div>
          ) : isManager ? (
            /* Manager Desk Scene */
            <div className="tf-illustration-wrapper tf-manager-scene">
              <div className="tf-calligraphy tf-manager-calligraphy">
                <span>Lead</span>
                <span className="tf-arrow-down">↘</span>
                <span>Plan</span>
                <span className="tf-arrow-down">↘</span>
                <span>Deliver</span>
              </div>

              {/* Desk & Elements SVG */}
              <div className="tf-scene-svg-wrap">
                <svg viewBox="0 0 520 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="tf-scene-svg">
                  {/* Soft blush background blob */}
                  <path d="M40 120 C100 60, 300 40, 500 110 C520 180, 380 200, 200 200 Z" fill="#FCEEE8" opacity="0.6" />

                  {/* Desk Surface */}
                  <rect x="25" y="160" width="470" height="12" rx="4" fill="#C28B70" />
                  <rect x="40" y="172" width="16" height="28" fill="#3D4451" />
                  <rect x="464" y="172" width="16" height="28" fill="#3D4451" />

                  {/* Team Floating Card */}
                  <g transform="translate(145, 75)">
                    <rect width="96" height="68" rx="8" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.06))" stroke="#F1F2F4" />
                    <text x="12" y="18" fill="#6B7280" fontSize="10" fontWeight="600">Team</text>
                    <circle cx="28" cy="42" r="10" fill="#E58B79" />
                    <circle cx="48" cy="42" r="10" fill="#B94B39" />
                    <circle cx="68" cy="42" r="10" fill="#E07A5F" />
                  </g>

                  {/* Tasks Floating Card */}
                  <g transform="translate(255, 65)">
                    <rect width="96" height="85" rx="8" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.06))" stroke="#F1F2F4" />
                    <text x="12" y="18" fill="#6B7280" fontSize="10" fontWeight="600">Tasks</text>
                    <rect x="12" y="27" width="9" height="9" rx="2" fill="#B94B39" />
                    <line x1="26" y1="31.5" x2="84" y2="31.5" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="12" y="42" width="9" height="9" rx="2" fill="#B94B39" />
                    <line x1="26" y1="46.5" x2="74" y2="46.5" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="12" y="57" width="9" height="9" rx="2" fill="#B94B39" />
                    <line x1="26" y1="61.5" x2="64" y2="61.5" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* Mini Analytics Card */}
                  <g transform="translate(365, 100)">
                    <rect width="42" height="48" rx="6" fill="#FFFFFF" filter="drop-shadow(0 3px 8px rgba(0,0,0,0.05))" stroke="#F1F2F4" />
                    <rect x="8" y="32" width="5" height="12" rx="1" fill="#F87171" />
                    <rect x="16" y="24" width="5" height="20" rx="1" fill="#FB923C" />
                    <rect x="24" y="16" width="5" height="28" rx="1" fill="#B94B39" />
                  </g>

                  {/* Laptop */}
                  <g transform="translate(130, 115)">
                    <rect x="0" y="0" width="105" height="66" rx="4" fill="#2E3440" />
                    <rect x="4" y="4" width="97" height="58" rx="2" fill="#1E232E" />
                    <polygon points="-12,66 117,66 110,68 -5,68" fill="#8892B0" />
                  </g>

                  {/* Potted Plant */}
                  <g transform="translate(80, 105)">
                    <polygon points="12,38 32,38 29,56 15,56" fill="#D97706" />
                    <ellipse cx="22" cy="22" rx="5" ry="14" fill="#2D6A4F" />
                    <ellipse cx="14" cy="25" rx="4" ry="11" transform="rotate(-25 14 25)" fill="#40916C" />
                    <ellipse cx="30" cy="25" rx="4" ry="11" transform="rotate(25 30 25)" fill="#52B788" />
                  </g>

                  {/* Notebook on table */}
                  <rect x="300" y="152" width="48" height="9" rx="2" fill="#D97706" />
                </svg>
              </div>
            </div>
          ) : (
            /* Employee Desk Scene */
            <div className="tf-illustration-wrapper tf-employee-scene">
              <div className="tf-scene-svg-wrap">
                <svg viewBox="0 0 520 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="tf-scene-svg">
                  <path d="M40 130 C120 70, 320 50, 500 120 C520 180, 380 200, 200 200 Z" fill="#E8F5E9" opacity="0.6" />

                  {/* Desk Surface */}
                  <rect x="25" y="160" width="470" height="12" rx="4" fill="#E5E7EB" />

                  {/* My Tasks Floating Card */}
                  <g transform="translate(290, 75)">
                    <rect width="96" height="85" rx="8" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.06))" stroke="#E5E7EB" />
                    <text x="12" y="18" fill="#374151" fontSize="10" fontWeight="600">My Tasks</text>
                    <rect x="12" y="27" width="10" height="10" rx="2" fill="#1E6B47" />
                    <path d="M14 32 L16 34 L20 29" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="28" y1="32" x2="84" y2="32" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="12" y="44" width="10" height="10" rx="2" fill="#1E6B47" />
                    <path d="M14 49 L16 51 L20 46" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="28" y1="49" x2="74" y2="49" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="12" y="61" width="10" height="10" rx="2" fill="#FFFFFF" stroke="#D1D5DB" />
                    <line x1="28" y1="66" x2="60" y2="66" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* Laptop */}
                  <g transform="translate(170, 105)">
                    <rect x="0" y="0" width="115" height="74" rx="5" fill="#374151" />
                    <rect x="5" y="5" width="105" height="64" rx="2" fill="#1F2937" />
                    <polygon points="-14,74 129,74 122,76 -7,76" fill="#9CA3AF" />
                  </g>

                  {/* Potted Plant */}
                  <g transform="translate(90, 95)">
                    <polygon points="12,45 34,45 31,65 15,65" fill="#1E3A2F" />
                    <ellipse cx="23" cy="24" rx="6" ry="18" fill="#2D6A4F" />
                    <ellipse cx="12" cy="30" rx="5" ry="15" transform="rotate(-28 12 30)" fill="#1E6B47" />
                    <ellipse cx="34" cy="30" rx="5" ry="15" transform="rotate(28 34 30)" fill="#40916C" />
                  </g>

                  {/* Books Stack */}
                  <g transform="translate(305, 142)">
                    <rect x="0" y="0" width="54" height="9" rx="2" fill="#165B3E" />
                    <rect x="3" y="9" width="54" height="9" rx="2" fill="#2D6A4F" />
                  </g>

                  {/* Coffee Mug with Smiley */}
                  <g transform="translate(375, 130)">
                    <rect x="0" y="0" width="30" height="30" rx="3" fill="#FDFBF7" stroke="#E5E7EB" />
                    <path d="M30 6 C36 6 36 22 30 22" stroke="#E5E7EB" strokeWidth="2.5" fill="none" />
                    <text x="4" y="9" fill="#1E6B47" fontSize="5" fontWeight="600">Good</text>
                    <text x="4" y="15" fill="#1E6B47" fontSize="5" fontWeight="600">Progress</text>
                    <text x="4" y="21" fill="#1E6B47" fontSize="5" fontWeight="600">Today</text>
                    <circle cx="15" cy="25" r="2.5" fill="none" stroke="#1E6B47" strokeWidth="0.8" />
                  </g>
                </svg>
              </div>

              <div className="tf-calligraphy tf-employee-calligraphy">
                <span>Small</span>
                <span>Steps</span>
                <span>Big</span>
                <span>Results</span>
                <span className="tf-calligraphy-smile">☺</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="tf-auth-footer">
        <div className="tf-footer-divider"></div>
        <div className="tf-footer-content">
          <span className="tf-footer-copy">© 2026 Task Management. All rights reserved.</span>
          <span className="tf-footer-motto">Plan Today. A Better Tomorrow.</span>
        </div>
      </footer>
    </div>
  );
}
