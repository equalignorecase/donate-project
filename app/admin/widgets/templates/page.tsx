'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Check,
  ExternalLink,
  Copy,
  Sliders,
  Flame,
  Search,
  Filter,
  Eye,
  Zap,
  Heart,
  Crown
} from 'lucide-react';
import { useAdmin } from '../../AdminContext';
import { GoalAppearance, goalAppearanceDefaults, readGoalAppearance } from '@/lib/goalAppearance';
import { goalTemplates, GoalTemplate, TemplateCategory } from '@/lib/goalTemplates';
import GoalWidget from '@/app/overlay/goal/GoalWidget';
import '@/app/overlay/widgets.css';
import './templates-gallery.css';

export default function GoalTemplatesGalleryPage() {
  const { showToast, handleUnauthorized } = useAdmin();
  const [currentAppearance, setCurrentAppearance] = useState<GoalAppearance>({ ...goalAppearanceDefaults });
  const [goalTitle, setGoalTitle] = useState('เป้าหมายโดเนท');
  const [goalTarget, setGoalTarget] = useState(15000);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPercent, setPreviewPercent] = useState<number>(65);
  const [copiedObs, setCopiedObs] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(async (res) => {
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = await res.json();
        if (data.success && data.settings) {
          setCurrentAppearance(readGoalAppearance(data.settings));
          if (data.settings.goal_title) setGoalTitle(data.settings.goal_title);
          if (data.settings.goal_target && Number(data.settings.goal_target) > 0) {
            setGoalTarget(Number(data.settings.goal_target));
          }
        }
      })
      .catch((err) => console.warn('Could not load settings:', err))
      .finally(() => setLoading(false));
  }, [handleUnauthorized]);

  const applyTemplate = async (template: GoalTemplate) => {
    setApplyingId(template.id);
    const updated = {
      ...currentAppearance,
      ...template.settings
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'บันทึกไม่สำเร็จ');
      }

      setCurrentAppearance(readGoalAppearance(result.settings || updated));
      showToast(`เปลี่ยนดีไซน์เป็น "${template.name}" เรียบร้อยแล้ว!`);
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setApplyingId(null);
    }
  };

  const copyObsUrl = () => {
    const url = `${window.location.origin}/overlay/goal`;
    navigator.clipboard.writeText(url);
    setCopiedObs(true);
    showToast('คัดลอกลิงก์ OBS Overlay แล้ว!');
    setTimeout(() => setCopiedObs(false), 2000);
  };

  const categories = [
    { key: 'all' as TemplateCategory, label: 'ทั้งหมด', count: goalTemplates.length },
    { key: 'minimal' as TemplateCategory, label: 'Minimal & Clean', count: goalTemplates.filter(t => t.category === 'minimal').length },
    { key: 'luxury' as TemplateCategory, label: 'Luxury & Aesthetic', count: goalTemplates.filter(t => t.category === 'luxury').length },
    { key: 'gaming' as TemplateCategory, label: 'Gaming & Cyber', count: goalTemplates.filter(t => t.category === 'gaming').length },
    { key: 'cute' as TemplateCategory, label: 'Cute & Anime', count: goalTemplates.filter(t => t.category === 'cute').length },
  ];

  const filteredTemplates = goalTemplates.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const previewCurrentValue = Math.round((goalTarget * previewPercent) / 100);

  return (
    <div className="goal-gallery-page">
      {/* Top Navigation & Action Header */}
      <div className="gallery-header-bar">
        <div className="gallery-header-left">
          <Link href="/admin/widgets" className="gallery-back-link">
            <ArrowLeft size={16} />
            <span>กลับหน้าปรับแต่งวิดเจ็ต</span>
          </Link>
          <div className="gallery-title-group">
            <div className="gallery-badge">
              <Sparkles size={13} />
              <span>DESIGN STUDIO GALLERY</span>
            </div>
            <h1>คลังเทมเพลตเป้าหมายโดเนท</h1>
            <p>เลือกดีไซน์สำเร็จรูปกว่า 17 แบบ กดปุ่มเดียวเพื่อนำไปใช้บนหน้าจอ OBS ของคุณได้ทันที</p>
          </div>
        </div>

        <div className="gallery-header-actions">
          <button type="button" onClick={copyObsUrl} className="gallery-obs-btn">
            {copiedObs ? <Check size={15} /> : <Copy size={15} />}
            <span>{copiedObs ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์ OBS'}</span>
          </button>
          <Link href="/overlay/goal" target="_blank" className="gallery-preview-btn">
            <Eye size={15} />
            <span>เปิดดูบน OBS</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Interactive Controls Bar: Category Filter + Live % Slider */}
      <div className="gallery-control-panel">
        <div className="gallery-filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`gallery-filter-pill ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              <span>{cat.label}</span>
              <span className="gallery-pill-count">{cat.count}</span>
            </button>
          ))}
        </div>

        <div className="gallery-interactive-tools">
          <div className="gallery-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหาชื่อดีไซน์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="gallery-slider-box">
            <div className="slider-meta">
              <span>ทดลองยอดโดเนท:</span>
              <strong>{previewPercent}%</strong>
              <small>(฿{previewCurrentValue.toLocaleString('th-TH')} / ฿{goalTarget.toLocaleString('th-TH')})</small>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={previewPercent}
              onChange={(e) => setPreviewPercent(Number(e.target.value))}
              className="gallery-range-input"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="gallery-cards-grid">
        {filteredTemplates.map((template) => {
          const isApplying = applyingId === template.id;
          // Check if template settings match current
          const isCurrentActive = Object.entries(template.settings).every(
            ([k, v]) => currentAppearance[k as keyof GoalAppearance] === v
          );

          // Simulated merged appearance for live card preview
          const cardAppearance: GoalAppearance = {
            ...currentAppearance,
            ...template.settings,
            goal_show_duration: 'false',
          };

          return (
            <div
              key={template.id}
              className={`gallery-card${isCurrentActive ? ' is-active' : ''}`}
            >
              <div className="gallery-card-top">
                <div className="gallery-card-titles">
                  <div className="gallery-card-tags">
                    <span className={`cat-tag cat-${template.category}`}>
                      {template.category.toUpperCase()}
                    </span>
                    {template.badge && (
                      <span className={`badge-tag badge-${template.badge.toLowerCase()}`}>
                        {template.badge}
                      </span>
                    )}
                    {isCurrentActive && (
                      <span className="badge-active">
                        <Check size={11} />
                        <span>กำลังใช้งาน</span>
                      </span>
                    )}
                  </div>
                  <h3>{template.name}</h3>
                  <span className="gallery-card-sub">{template.nameEn}</span>
                </div>
              </div>

              {/* Live Interactive Preview Box */}
              <div className="gallery-card-preview-viewport">
                <GoalWidget
                  title={goalTitle}
                  current={previewCurrentValue}
                  target={goalTarget}
                  appearance={cardAppearance}
                />
              </div>

              <p className="gallery-card-desc">{template.description}</p>

              {/* Action Button */}
              <button
                type="button"
                className={`gallery-apply-btn${isCurrentActive ? ' applied' : ''}`}
                disabled={isApplying || loading}
                onClick={() => applyTemplate(template)}
              >
                {isApplying ? (
                  <span>กำลังนำไปใช้...</span>
                ) : isCurrentActive ? (
                  <>
                    <Check size={16} />
                    <span>กำลังใช้งานบนสตรีม</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>ใช้งานดีไซน์นี้</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
