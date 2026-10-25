'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Sun, Grid, Eye, X } from 'lucide-react';
import './overlay-toolbar.css';

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  const [bgMode, setBgMode] = useState<'transparent' | 'dark' | 'light'>('transparent');
  const [isObs, setIsObs] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  useEffect(() => {
    // 1. Detect OBS Studio Browser Source via query param (?obs=1) or user agent
    const params = new URLSearchParams(window.location.search);
    const obsParam = params.get('obs');
    const isObsParam = obsParam === '1' || obsParam === 'true';
    const isObsUserAgent = typeof navigator !== 'undefined' && /OBS/i.test(navigator.userAgent);
    
    if (isObsParam || isObsUserAgent) {
      setIsObs(true);
      return;
    }

    // 2. Read saved preview background preference
    const saved = localStorage.getItem('overlay_preview_bg') as 'transparent' | 'dark' | 'light' | null;
    if (saved && ['transparent', 'dark', 'light'].includes(saved)) {
      setBgMode(saved);
    }
  }, []);

  const changeMode = (mode: 'transparent' | 'dark' | 'light') => {
    setBgMode(mode);
    localStorage.setItem('overlay_preview_bg', mode);
  };

  return (
    <div className={`overlay-root-wrapper bg-${bgMode}${isObs ? ' is-obs' : ''}`}>
      {children}

      {!isObs && showToolbar && (
        <aside className="overlay-preview-toolbar" role="region" aria-label="Overlay Preview Controls">
          <div className="preview-toolbar-pill">
            <span className="preview-toolbar-label">
              <Eye size={13} />
              <span>พรีวิว</span>
            </span>

            <button
              type="button"
              className={`preview-toggle-btn${bgMode === 'dark' ? ' active' : ''}`}
              onClick={() => changeMode('dark')}
              title="สลับพื้นหลัง Dark (สีเข้ม)"
              aria-label="พื้นหลังเข้ม Dark"
            >
              <Moon size={14} />
              <span>มืด</span>
            </button>

            <button
              type="button"
              className={`preview-toggle-btn${bgMode === 'light' ? ' active' : ''}`}
              onClick={() => changeMode('light')}
              title="สลับพื้นหลัง Light (สีสว่าง)"
              aria-label="พื้นหลังสว่าง Light"
            >
              <Sun size={14} />
              <span>สว่าง</span>
            </button>

            <button
              type="button"
              className={`preview-toggle-btn${bgMode === 'transparent' ? ' active' : ''}`}
              onClick={() => changeMode('transparent')}
              title="พื้นหลังโปร่งใส (เหมือนใน OBS)"
              aria-label="พื้นหลังโปร่งใส Transparent"
            >
              <Grid size={14} />
              <span>OBS</span>
            </button>

            <button
              type="button"
              className="preview-close-btn"
              onClick={() => setShowToolbar(false)}
              title="ซ่อนแถบควบคุม"
              aria-label="ซ่อนแถบควบคุม"
            >
              <X size={13} />
            </button>
          </div>
        </aside>
      )}

      {/* Small restore button if minimized */}
      {!isObs && !showToolbar && (
        <button
          type="button"
          className="overlay-preview-minimized-btn"
          onClick={() => setShowToolbar(true)}
          title="เปิดแถบพรีวิวพื้นหลัง"
          aria-label="เปิดแถบพรีวิวพื้นหลัง"
        >
          <Eye size={14} />
        </button>
      )}
    </div>
  );
}
