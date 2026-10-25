'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CircleAlert, Check, Eye, EyeOff, LoaderCircle, Moon, Sun } from 'lucide-react';
import '../admin/theme.css';
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    let initial: 'light' | 'dark' = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    try {
      const saved = localStorage.getItem('admin_theme');
      if (saved === 'dark' || saved === 'light') initial = saved;
    } catch {}
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('admin_theme', next); } catch {}
  };

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
    <main className="login-page-wrapper">
      <div className="login-image-pane">
        <img
          className="login-artwork"
          src="https://wallpapercat.com/w/full/b/2/c/5827240.jpg"
          alt=""
          loading="eager"
          fetchPriority="high"
          referrerPolicy="no-referrer"
          onError={(event) => { event.currentTarget.hidden = true; }}
        />
        <Link href="/" className="login-back-link"><ArrowLeft size={16} />กลับหน้าโดเนท</Link>
        <div className="login-image-caption"><span>localhostvlr</span><p>ระบบจัดการสตรีม</p></div>
      </div>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-toolbar">
          <button type="button" className="login-theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'ใช้โหมดสว่าง' : 'ใช้โหมดมืด'} title={theme === 'dark' ? 'ใช้โหมดสว่าง' : 'ใช้โหมดมืด'}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
          </button>
        </div>

        <div className="login-container">
          <header className="login-header"><h1 id="login-title">เข้าสู่ระบบ</h1><p>จัดการโดเนทและการแจ้งเตือนของสตรีม</p></header>

          {errorMessage && <div className="login-alert error" role="alert"><CircleAlert size={17} /><span>{errorMessage}</span></div>}
          {successMessage && <div className="login-alert success" role="status"><Check size={17} /><span>{successMessage}</span></div>}

          <form onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
            <fieldset className="login-fields" disabled={isLoading || !!successMessage}>
              <div className="login-form-group">
                <label className="login-label" htmlFor="username">ชื่อผู้ใช้</label>
                <input
                  ref={usernameRef}
                  type="text"
                  id="username"
                  className={`login-input ${hasSubmitted && errors.username ? 'input-error' : ''}`}
                  placeholder="กรอกชื่อผู้ใช้"
                  value={username}
                  onChange={handleUsernameChange}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-required="true"
                  aria-invalid={Boolean(hasSubmitted && errors.username)}
                  aria-describedby={hasSubmitted && errors.username ? 'username-error' : undefined}
                />
                {hasSubmitted && errors.username && <p id="username-error" role="alert" className="login-error-text">{errors.username}</p>}
              </div>

              <div className="login-form-group">
                <label className="login-label" htmlFor="password">รหัสผ่าน</label>
                <div className="login-input-wrap">
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`login-input has-action ${hasSubmitted && errors.password ? 'input-error' : ''}`}
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    aria-required="true"
                    aria-invalid={Boolean(hasSubmitted && errors.password)}
                    aria-describedby={hasSubmitted && errors.password ? 'password-error' : undefined}
                  />
                  <button type="button" className="login-toggle-pw-btn" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-controls="password">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {hasSubmitted && errors.password && <p id="password-error" role="alert" className="login-error-text">{errors.password}</p>}
              </div>

              <button type="submit" className="login-btn-submit" disabled={isLoading || !!successMessage}>
                {isLoading ? <><LoaderCircle size={18} className="login-spinner" />กำลังตรวจสอบ…</> : successMessage ? <><Check size={18} />เข้าสู่ระบบแล้ว</> : <>เข้าสู่ระบบ<ArrowRight size={18} /></>}
              </button>
            </fieldset>
          </form>

          <div className="login-footer-nav"><Link href="/" className="login-footer-link">หน้าโดเนท</Link><span aria-hidden="true">·</span><Link href="/overlay" target="_blank" rel="noopener noreferrer" className="login-footer-link">OBS Overlay<ArrowRight size={12} /></Link></div>
        </div>
        <footer className="login-page-footer">localhostvlr · สำหรับผู้ดูแลระบบ</footer>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page-wrapper login-loading" role="status">กำลังโหลด…</main>}>
      <LoginForm />
    </Suspense>
  );
}
