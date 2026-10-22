'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import '../donate/donate.css';
import './login.css';

interface FormErrors {
  username?: string;
  password?: string;
}

const validateUsername = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'กรุณากรอกชื่อผู้ใช้';
  }
  if (value.includes(' ')) {
    return 'ชื่อผู้ใช้ต้องไม่มีการเว้นวรรค';
  }
  if (trimmed.length < 3) {
    return 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร';
  }
  if (trimmed.length > 30) {
    return 'ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 30 ตัวอักษร';
  }
  const validPattern = /^[a-zA-Z0-9_.-]+$/;
  if (!validPattern.test(trimmed)) {
    return 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือ _ . - เท่านั้น';
  }
  return '';
};

const validatePassword = (value: string): string => {
  if (!value) {
    return 'กรุณากรอกรหัสผ่าน';
  }
  if (value.length < 4) {
    return 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร';
  }
  if (value.length > 100) {
    return 'รหัสผ่านต้องมีความยาวไม่เกิน 100 ตัวอักษร';
  }
  return '';
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_theme');
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {}
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    if (errorMessage) setErrorMessage('');
    if (hasSubmitted) {
      setErrors(prev => ({ ...prev, username: validateUsername(val) }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (errorMessage) setErrorMessage('');
    if (hasSubmitted) {
      setErrors(prev => ({ ...prev, password: validatePassword(val) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setHasSubmitted(true);

    const userErr = validateUsername(username);
    const passErr = validatePassword(password);

    setErrors({ username: userErr, password: passErr });

    if (userErr) {
      usernameRef.current?.focus();
      return;
    }
    if (passErr) {
      passwordRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }

      if (data.token) {
        localStorage.setItem('donate_admin_token', data.token);
      }

      setSuccessMessage('เข้าสู่ระบบสำเร็จ กำลังพาไปยังระบบหลังบ้าน...');

      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        {/* Header Branding */}
        <div className="login-header">
          <div className="login-brand-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
              <circle cx="12" cy="12" r="2" />
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
              <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
            </svg>
          </div>
          <h1 className="login-title">
            เข้าสู่ระบบหลังบ้าน
          </h1>
          <p className="login-desc">
            ระบบจัดการสตรีมเมอร์ &amp; ปรับแต่งแจ้งเตือน OBS Studio
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="login-alert error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="login-alert success" role="status">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Card */}
        <div className="login-card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="login-form-group">
              <label className="login-label" htmlFor="username">
                ชื่อผู้ใช้ (Username)
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  ref={usernameRef}
                  type="text"
                  id="username"
                  className={`login-input ${hasSubmitted && errors.username ? 'input-error' : ''}`}
                  placeholder="กรอกชื่อผู้ใช้"
                  value={username}
                  onChange={handleUsernameChange}
                  autoComplete="username"
                  autoFocus
                  aria-invalid={Boolean(hasSubmitted && errors.username)}
                  aria-describedby={hasSubmitted && errors.username ? 'username-error' : undefined}
                />
              </div>
              {hasSubmitted && errors.username && (
                <div id="username-error" role="alert" className="login-error-text">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errors.username}</span>
                </div>
              )}
            </div>

            <div className="login-form-group">
              <label className="login-label" htmlFor="password">
                รหัสผ่าน (Password)
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`login-input has-action ${hasSubmitted && errors.password ? 'input-error' : ''}`}
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  aria-invalid={Boolean(hasSubmitted && errors.password)}
                  aria-describedby={hasSubmitted && errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="login-toggle-pw-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {hasSubmitted && errors.password && (
                <div id="password-error" role="alert" className="login-error-text">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="login-btn-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-spinner"></span>
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="login-footer-nav">
          <Link href="/" className="login-footer-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>กลับหน้าบริจาค</span>
          </Link>
          <span className="login-footer-dot">•</span>
          <Link href="/overlay" target="_blank" className="login-footer-link">
            <span>OBS Overlay</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        กำลังโหลด...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
