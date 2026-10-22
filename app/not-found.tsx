'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, ArrowLeft } from 'lucide-react';
import './not-found.css';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    document.title = '404 - ไม่พบหน้าเว็บ | ระบบโดเนท & Stream Alert';
  }, []);

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="not-found-page-wrapper">
      <div className="bg-mesh" aria-hidden="true" />

      <main className="not-found-container" role="main">
        <div className="not-found-card">
          <div className="not-found-ambient-glow" aria-hidden="true" />

          {/* Hero Icon Badge */}
          <div className="not-found-badge-wrapper">
            <div className="not-found-icon-circle" aria-hidden="true">
              <Compass size={36} strokeWidth={2.2} />
            </div>
            <span className="not-found-status-tag">404 ERROR</span>
          </div>

          {/* Large Stylized 404 & Typography */}
          <div className="not-found-number" aria-hidden="true">
            404
          </div>
          <h1 className="not-found-title">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="not-found-desc">
            หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย เปลี่ยนชื่อ หรือไม่มีอยู่จริงในระบบ กรุณาตรวจสอบ URL อีกครั้ง
          </p>

          {/* Action Button: Go Back Only */}
          <div className="not-found-actions">
            <button
              type="button"
              onClick={handleGoBack}
              className="btn-404-primary"
              id="btn-go-back"
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft size={18} strokeWidth={2.2} />
              <span>ย้อนกลับ</span>
            </button>
          </div>

          {/* Metadata Footer */}
          <div className="not-found-meta-footer" aria-hidden="true">
            <span>Status: 404</span>
            <span className="not-found-meta-dot" />
            <span>Resource Not Found</span>
          </div>
        </div>
      </main>
    </div>
  );
}
