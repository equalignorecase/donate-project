'use client';

import React from 'react';

export interface MobileTopBarProps {
  onOpenSidebar: () => void;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  rightAction?: React.ReactNode;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function MobileTopBar({
  onOpenSidebar,
  title = 'Streamer Admin',
  subtitle = 'จัดการระบบโดเนท & สตรีม',
  badge,
  rightAction,
  theme = 'light',
  onToggleTheme
}: MobileTopBarProps) {
  return (
    <div className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          className="hamburger-btn"
          onClick={onOpenSidebar}
          aria-label="เปิดเมนู"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{title}</span>
            {badge}
          </div>
          {subtitle && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onToggleTheme && (
          <button
            type="button"
            className="mobile-theme-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
        )}
        {rightAction && <div>{rightAction}</div>}
      </div>
    </div>
  );
}
