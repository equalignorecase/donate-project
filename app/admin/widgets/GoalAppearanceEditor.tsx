'use client';

import React, { useState } from 'react';
import {
  Target,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Palette,
  Sliders,
  Type,
  Check,
  Eye,
  Gamepad2,
  Grid,
  Clock,
  Calendar
} from 'lucide-react';
import {
  GoalAppearance,
  goalAppearanceDefaults,
  goalAppearanceRanges,
  goalFontOptions,
  formatGoalDuration
} from '@/lib/goalAppearance';
import GoalWidget from '@/app/overlay/goal/GoalWidget';
import './goal-editor-premium.css';

interface GoalAppearanceEditorProps {
  value: GoalAppearance;
  onChange: (value: GoalAppearance) => void;
  disabled: boolean;
  title: string;
  target: number;
}

const colors: { key: keyof GoalAppearance; label: string; group: string }[] = [
  { key: 'goal_bar_color', label: 'หลอดเริ่มต้น', group: 'bar' },
  { key: 'goal_bar_end_color', label: 'หลอดปลายทาง (Gradient)', group: 'bar' },
  { key: 'goal_track_color', label: 'พื้นหลังรางหลอด', group: 'bar' },
  { key: 'goal_bg_color', label: 'พื้นหลังการ์ด', group: 'card' },
  { key: 'goal_border_color', label: 'ขอบการ์ด', group: 'card' },
  { key: 'goal_text_color', label: 'ข้อความและยอดเงิน', group: 'text' },
  { key: 'goal_accent_color', label: 'ตัวเลขเปอร์เซ็นต์', group: 'text' },
];

const sizes: { key: keyof GoalAppearance; label: string; unit: string }[] = [
  { key: 'goal_bar_radius', label: 'ความโค้งหลอด', unit: 'px' },
  { key: 'goal_bar_height', label: 'ความสูงหลอด', unit: 'px' },
  { key: 'goal_track_opacity', label: 'ความทึบรางหลอด (Track Opacity)', unit: '%' },
  { key: 'goal_track_blur', label: 'ความเบลอรางหลอด (Track Blur)', unit: 'px' },
  { key: 'goal_width', label: 'ความกว้างการ์ด', unit: 'px' },
  { key: 'goal_padding', label: 'ระยะขอบด้านใน', unit: 'px' },
  { key: 'goal_radius', label: 'ความโค้งการ์ด', unit: 'px' },
  { key: 'goal_opacity', label: 'ความทึบพื้นหลังการ์ด', unit: '%' },
  { key: 'goal_title_size', label: 'ขนาดชื่อเป้าหมาย', unit: 'px' },
  { key: 'goal_amount_size', label: 'ขนาดยอดเงินในหลอด', unit: 'px' },
];

const styleOptions = [
  { style: 'glass', label: 'แก้วมันวาว (Liquid Glass)', desc: 'ผิวใสสะท้อนแสง 3D ลักชัวรี', icon: Sparkles },
  { style: 'neon', label: 'นีออนเรืองแสง (Cyber Neon)', desc: 'ขอบเรืองแสงสว่างสดใสสไตล์ไซเบอร์', icon: Zap },
  { style: 'striped', label: 'ลายเฉียงวิ่ง (Sport Stripe)', desc: 'ลายวิ่งสปอร์ต โฉบเฉี่ยวมีชีวิตชีวา', icon: Activity },
  { style: 'minimal', label: 'เรียบหรู (Clean Minimal)', desc: 'เรียบเนียน สะอาดตา ทันสมัย', icon: Layers },
] as const;

export default function GoalAppearanceEditor({
  value,
  onChange,
  disabled,
  title,
  target,
}: GoalAppearanceEditorProps) {
  const [previewBackdrop, setPreviewBackdrop] = useState<'gaming' | 'neon' | 'checker' | 'dark'>('gaming');

  const update = (key: keyof GoalAppearance, next: string) => {
    onChange({ ...value, [key]: next });
  };

  const toggleBoolean = (key: keyof GoalAppearance) => {
    update(key, value[key] === 'true' ? 'false' : 'true');
  };

  return (
    <div className="goal-premium-editor">
      {/* Studio Header Bar */}
      <div className="goal-editor-hero">
        <div>
          <div className="goal-hero-badge">
            <Target size={13} />
            <span>GOAL APPEARANCE STUDIO</span>
          </div>
          <h2>ปรับแต่งดีไซน์หลอดเป้าหมาย</h2>
          <p>ปรับหน้าตา สไตล์ ผิวสัมผัส ความโค้งมน และแสงวาว — พรีวิวอัปเดตสดทันที</p>
        </div>
        <button
          type="button"
          className="goal-reset-btn"
          disabled={disabled}
          onClick={() => onChange({ ...goalAppearanceDefaults })}
          title="คืนค่ารูปแบบเริ่มต้น"
        >
          <RotateCcw size={14} />
          <span>รีเซ็ตค่าเริ่มต้น</span>
        </button>
      </div>


      {/* Section 1: รูปแบบหลอด & เอฟเฟกต์แสงวาว */}
      <section className="goal-section-card">
        <div className="goal-section-header">
          <div className="goal-section-icon icon-blue">
            <Sparkles size={18} />
          </div>
          <div>
            <h3>รูปแบบหลอดและเอฟเฟกต์แสงวาว</h3>
            <p>เลือกสไตล์ผิวสัมผัส พร้อมเปิด/ปิดแอนิเมชันและประกายแสงวาวแบบพรีเมียม</p>
          </div>
        </div>

        {/* 4 Interactive Style Cards */}
        <div className="goal-style-grid">
          {styleOptions.map(({ style, label, desc, icon: IconComponent }) => {
            const isSelected = value.goal_bar_style === style;
            return (
              <button
                key={style}
                type="button"
                className={`goal-style-card${isSelected ? ' selected' : ''}`}
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => update('goal_bar_style', style)}
              >
                <div className="goal-style-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconComponent size={15} color={isSelected ? '#2563eb' : '#64748b'} />
                    <span className="goal-style-title">{label}</span>
                  </div>
                  {isSelected && <span className="goal-style-badge">ACTIVE</span>}
                </div>

                <span
                  className={`goal-style-sample goal-track goal-track-${style}`}
                  style={{ borderRadius: `${value.goal_bar_radius || '50'}px` }}
                  aria-hidden="true"
                >
                  <span
                    className="goal-fill"
                    style={{ borderRadius: `${value.goal_bar_radius || '50'}px` }}
                  >
                    <span className="goal-bar-texture" />
                    <span className="goal-bar-gloss" />
                    <span className="goal-bar-shine" />
                    {value.goal_bar_shine === 'true' && (
                      <span className="goal-bar-shine-sweep">
                        <span className="goal-bar-beam" />
                      </span>
                    )}
                  </span>
                </span>

                <small>{desc}</small>
              </button>
            );
          })}
        </div>

        {/* Shine & Animation Switches */}
        <div className="goal-effects-row">
          <div
            className={`goal-switch-card${value.goal_bar_shine === 'true' ? ' active' : ''}`}
            onClick={() => !disabled && toggleBoolean('goal_bar_shine')}
            role="switch"
            aria-checked={value.goal_bar_shine === 'true'}
          >
            <div className="goal-switch-info">
              <Sparkles size={18} color={value.goal_bar_shine === 'true' ? '#2563eb' : '#64748b'} />
              <div>
                <div className="goal-switch-title">แสงวาวพาดผ่านหลอด (Luxury Crystal Sheen)</div>
                <div className="goal-switch-desc">ลำแสงใยไหมฟุ้งเนียนตา พาดผ่านผิวกระจกคริสตัล 3D</div>
              </div>
            </div>
            <div className="goal-switch-track">
              <div className="goal-switch-thumb" />
            </div>
          </div>

          <div
            className={`goal-switch-card${value.goal_bar_animated === 'true' ? ' active' : ''}`}
            onClick={() => !disabled && toggleBoolean('goal_bar_animated')}
            role="switch"
            aria-checked={value.goal_bar_animated === 'true'}
          >
            <div className="goal-switch-info">
              <Activity size={18} color={value.goal_bar_animated === 'true' ? '#2563eb' : '#64748b'} />
              <div>
                <div className="goal-switch-title">เปิดแสงและลายเคลื่อนไหว (Live Motion)</div>
                <div className="goal-switch-desc">ลายเส้นและเงาสะท้อนขยับตลอดเวลาอย่างนุ่มนวล</div>
              </div>
            </div>
            <div className="goal-switch-track">
              <div className="goal-switch-thumb" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: ชุดสีและแสง */}
      <section className="goal-section-card">
        <div className="goal-section-header">
          <div className="goal-section-icon icon-purple">
            <Palette size={18} />
          </div>
          <div>
            <h3>ชุดสีและแสง (Color Palette)</h3>
            <p>กำหนดเฉดสีตัวหลอด พื้นหลัง และตัวหนังสือ ให้เข้ากับธีมสตรีมของคุณ</p>
          </div>
        </div>

        <div className="goal-color-grid">
          {colors.map(({ key, label }) => (
            <label className="goal-color-item" key={key}>
              <span className="goal-color-label">{label}</span>
              <div className="goal-swatch-wrapper">
                <div
                  className="goal-color-preview-circle"
                  style={{ backgroundColor: value[key] }}
                >
                  <input
                    type="color"
                    className="goal-color-input-hidden"
                    aria-label={label}
                    value={value[key]}
                    disabled={disabled}
                    onChange={e => update(key, e.target.value)}
                  />
                </div>
                <span className="goal-hex-badge">{value[key].toUpperCase()}</span>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Section 3: มิติขนาดและความโค้งมน */}
      <section className="goal-section-card">
        <div className="goal-section-header">
          <div className="goal-section-icon icon-amber">
            <Sliders size={18} />
          </div>
          <div>
            <h3>มิติขนาดและความโค้งมน (Geometry &amp; Sizing)</h3>
            <p>ปรับความโค้งของหลอด ความสูง ความกว้าง และสัดส่วนต่างๆ ได้อย่างอิสระ</p>
          </div>
        </div>

        <div className="goal-range-grid">
          {sizes.map(({ key, label, unit }) => {
            const [min, max] = goalAppearanceRanges[key] || [0, 100];
            return (
              <div className="goal-range-card" key={key}>
                <div className="goal-range-header">
                  <span className="goal-range-label">{label}</span>
                  <span className="goal-range-val-badge">
                    {value[key]} {unit}
                  </span>
                </div>
                <input
                  type="range"
                  className="goal-range-slider"
                  min={min}
                  max={max}
                  value={value[key]}
                  disabled={disabled}
                  onChange={e => update(key, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4: ฟอนต์และการแสดงผล */}
      <section className="goal-section-card">
        <div className="goal-section-header">
          <div className="goal-section-icon icon-emerald">
            <Type size={18} />
          </div>
          <div>
            <h3>ฟอนต์และองค์ประกอบการแสดงผล</h3>
            <p>เลือกแบบอักษรและเปิด/ปิดส่วนประกอบข้อมูลที่ต้องการแสดง</p>
          </div>
        </div>

        {/* Font Picker */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13.5px', fontWeight: 600 }}>
            ฟอนต์ตัวอักษร
          </label>
          <div className="goal-font-select-wrapper">
            <select
              className="goal-font-select"
              value={value.goal_font}
              disabled={disabled}
              onChange={e => update('goal_font', e.target.value)}
            >
              {goalFontOptions.map(font => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle Pills */}
        <div className="goal-display-grid">
          {[
            { key: 'goal_text_inside', label: 'แสดงตัวเลขในตัวหลอด (50฿ 50%)' },
            { key: 'goal_show_border', label: 'แสดงขอบการ์ด' },
            { key: 'goal_gradient', label: 'ไล่สีหลอด (Gradient)' },
            { key: 'goal_show_amount', label: 'แสดงยอดเงิน' },
            { key: 'goal_show_percent', label: 'แสดงเปอร์เซ็นต์' },
          ].map(({ key, label }) => {
            const isActive = value[key as keyof GoalAppearance] === 'true';
            return (
              <div
                key={key}
                className={`goal-display-pill${isActive ? ' active' : ''}`}
                onClick={() => !disabled && toggleBoolean(key as keyof GoalAppearance)}
                role="checkbox"
                aria-checked={isActive}
              >
                <div className="goal-checkbox-custom">
                  {isActive && <Check size={12} strokeWidth={3} />}
                </div>
                <span className="goal-display-pill-text">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Duration Configuration */}
        <div className="goal-duration-card">
          <div className="goal-duration-header">
            <div className="goal-duration-title-group">
              <Clock size={16} color="#2563eb" />
              <span className="goal-duration-title">ระยะเวลาเป้าหมาย (Donation Duration / Countdown)</span>
            </div>
            <div
              className={`goal-display-pill${value.goal_show_duration === 'true' ? ' active' : ''}`}
              style={{ margin: 0, padding: '6px 14px' }}
              onClick={() => !disabled && toggleBoolean('goal_show_duration')}
              role="checkbox"
              aria-checked={value.goal_show_duration === 'true'}
            >
              <div className="goal-checkbox-custom">
                {value.goal_show_duration === 'true' && <Check size={12} strokeWidth={3} />}
              </div>
              <span className="goal-display-pill-text">แสดงระยะเวลาสิ้นสุด</span>
            </div>
          </div>

          {value.goal_show_duration === 'true' && (
            <div className="goal-duration-body">
              {/* Quick Presets */}
              <div className="goal-duration-presets">
                <span className="goal-duration-preset-label">ตั้งเวลารวดเร็ว:</span>
                {[7, 15, 30, 60, 90].map(days => {
                  const targetDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
                  const isMatch = value.goal_end_date === targetDate;
                  return (
                    <button
                      key={days}
                      type="button"
                      disabled={disabled}
                      className={`goal-duration-preset-btn${isMatch ? ' active' : ''}`}
                      onClick={() => update('goal_end_date', targetDate)}
                    >
                      +{days} วัน
                    </button>
                  );
                })}
              </div>

              {/* Custom Date & Text Grid */}
              <div className="goal-duration-inputs-grid">
                <div className="goal-duration-input-wrapper">
                  <label htmlFor="goal-end-date-input">
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    วันที่สิ้นสุดเป้าหมาย
                  </label>
                  <input
                    id="goal-end-date-input"
                    type="date"
                    className="goal-duration-input"
                    value={value.goal_end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                    disabled={disabled}
                    onChange={e => update('goal_end_date', e.target.value)}
                  />
                </div>

                <div className="goal-duration-input-wrapper">
                  <label htmlFor="goal-prefix-input">ข้อความนำหน้า</label>
                  <input
                    id="goal-prefix-input"
                    type="text"
                    className="goal-duration-input"
                    placeholder="เช่น สิ้นสุดใน หรือ เหลืออีก"
                    value={value.goal_duration_text ?? 'สิ้นสุดใน'}
                    disabled={disabled}
                    maxLength={40}
                    onChange={e => update('goal_duration_text', e.target.value)}
                  />
                </div>
              </div>

              {/* Custom Badge Styling Subsection */}
              <div className="goal-duration-custom-section">
                <div className="goal-duration-custom-heading">
                  <Palette size={14} color="#2563eb" />
                  <span>ปรับแต่งสไตล์ป้ายระยะเวลา (Custom Badge Style)</span>
                </div>

                {/* 1. Badge Style */}
                <div className="goal-duration-field">
                  <label className="goal-duration-field-label">รูปแบบป้าย (Badge Style)</label>
                  <div className="goal-duration-style-pills">
                    {[
                      { id: 'glass', label: 'แก้วมัว (Glass)', icon: Sparkles },
                      { id: 'solid', label: 'สีทึบ (Solid)', icon: Layers },
                      { id: 'outline', label: 'เส้นขอบ (Outline)', icon: Grid },
                      { id: 'clean', label: 'ข้อความเปล่า (Clean Text)', icon: Type },
                      { id: 'glow', label: 'นีออนเรืองแสง (Glow)', icon: Zap },
                    ].map(({ id, label, icon: IconComponent }) => (
                      <button
                        key={id}
                        type="button"
                        disabled={disabled}
                        className={`goal-duration-style-btn${(value.goal_duration_style || 'glass') === id ? ' active' : ''}`}
                        onClick={() => update('goal_duration_style', id)}
                      >
                        <IconComponent size={13} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Badge Position */}
                <div className="goal-duration-field">
                  <label className="goal-duration-field-label">ตำแหน่งการจัดวาง (Placement)</label>
                  <div className="goal-duration-style-pills">
                    {[
                      { id: 'top', label: '⬆️ ด้านบนหลอด (ใต้ชื่อ)' },
                      { id: 'bottom', label: '⬇️ ด้านล่างหลอด' },
                      { id: 'inline', label: '🏷️ ต่อท้ายชื่อเป้าหมาย' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        disabled={disabled}
                        className={`goal-duration-style-btn${(value.goal_duration_position || 'top') === id ? ' active' : ''}`}
                        onClick={() => update('goal_duration_position', id)}
                      >
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Corner Radius */}
                <div className="goal-duration-field">
                  <label className="goal-duration-field-label">ความโค้งมนของป้าย (Corner Radius)</label>
                  <div className="goal-duration-style-pills">
                    {[
                      { id: '9999', label: 'แคปซูล (Pill)' },
                      { id: '8', label: 'โค้งมน (Rounded 8px)' },
                      { id: '4', label: 'เหลี่ยมมน (Square 4px)' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        disabled={disabled}
                        className={`goal-duration-style-btn${(value.goal_duration_radius || '9999') === id ? ' active' : ''}`}
                        onClick={() => update('goal_duration_radius', id)}
                      >
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Font Size & Background Opacity */}
                <div className="goal-duration-sliders-grid">
                  <div className="goal-duration-slider-card">
                    <div className="goal-duration-slider-header">
                      <span>ขนาดตัวอักษร</span>
                      <span className="goal-range-val-badge">{value.goal_duration_size || '13'} px</span>
                    </div>
                    <input
                      type="range"
                      className="goal-range-slider"
                      min="10"
                      max="26"
                      value={value.goal_duration_size || '13'}
                      disabled={disabled}
                      onChange={e => update('goal_duration_size', e.target.value)}
                    />
                  </div>

                  <div className="goal-duration-slider-card">
                    <div className="goal-duration-slider-header">
                      <span>ความทึบพื้นหลังป้าย</span>
                      <span className="goal-range-val-badge">{value.goal_duration_bg_opacity ?? '70'} %</span>
                    </div>
                    <input
                      type="range"
                      className="goal-range-slider"
                      min="0"
                      max="100"
                      value={value.goal_duration_bg_opacity ?? '70'}
                      disabled={disabled}
                      onChange={e => update('goal_duration_bg_opacity', e.target.value)}
                    />
                  </div>
                </div>

                {/* 5. Colors Grid */}
                <div className="goal-duration-colors-grid">
                  <div className="goal-duration-color-card">
                    <label htmlFor="goal-dur-color" className="goal-duration-color-label">สีตัวหนังสือ</label>
                    <div className="goal-color-input-wrapper" style={{ margin: 0 }}>
                      <input
                        id="goal-dur-color"
                        type="color"
                        className="goal-color-input"
                        value={value.goal_duration_color || '#e0f2fe'}
                        disabled={disabled}
                        onChange={e => update('goal_duration_color', e.target.value)}
                      />
                      <span className="goal-hex-badge">{(value.goal_duration_color || '#E0F2FE').toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="goal-duration-color-card">
                    <label htmlFor="goal-dur-bg" className="goal-duration-color-label">สีพื้นหลังป้าย</label>
                    <div className="goal-color-input-wrapper" style={{ margin: 0 }}>
                      <input
                        id="goal-dur-bg"
                        type="color"
                        className="goal-color-input"
                        value={value.goal_duration_bg_color || '#0f172a'}
                        disabled={disabled}
                        onChange={e => update('goal_duration_bg_color', e.target.value)}
                      />
                      <span className="goal-hex-badge">{(value.goal_duration_bg_color || '#0F172A').toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="goal-duration-color-card">
                    <label htmlFor="goal-dur-border" className="goal-duration-color-label">สีเส้นขอบป้าย</label>
                    <div className="goal-color-input-wrapper" style={{ margin: 0 }}>
                      <input
                        id="goal-dur-border"
                        type="color"
                        className="goal-color-input"
                        value={value.goal_duration_border_color || '#3b82f6'}
                        disabled={disabled}
                        onChange={e => update('goal_duration_border_color', e.target.value)}
                      />
                      <span className="goal-hex-badge">{(value.goal_duration_border_color || '#3B82F6').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Toggle Clock Icon */}
                <div
                  className={`goal-display-pill${value.goal_duration_show_icon !== 'false' ? ' active' : ''}`}
                  style={{ margin: 0, padding: '8px 14px' }}
                  onClick={() => !disabled && toggleBoolean('goal_duration_show_icon')}
                  role="checkbox"
                  aria-checked={value.goal_duration_show_icon !== 'false'}
                >
                  <div className="goal-checkbox-custom">
                    {value.goal_duration_show_icon !== 'false' && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className="goal-display-pill-text">แสดงไอคอนนาฬิกา (⏱️ Clock Icon)</span>
                </div>

                {/* 7. Live Preview Callout */}
                <div className="goal-duration-preview-canvas">
                  <span className="goal-duration-preview-canvas-label">ตัวอย่างป้ายสไตล์ที่คุณเลือก</span>
                  <div style={{ display: 'inline-flex' }}>
                    <span
                      className={`goal-duration-badge goal-duration-${value.goal_duration_style || 'glass'}`}
                      style={{
                        color: value.goal_duration_color || '#e0f2fe',
                        fontSize: `${value.goal_duration_size || 13}px`,
                        borderRadius: value.goal_duration_radius === '4' ? '4px' : value.goal_duration_radius === '8' ? '8px' : '9999px',
                        background: (value.goal_duration_style === 'clean') ? 'transparent' : (value.goal_duration_style === 'solid') ? (value.goal_duration_bg_color || '#0f172a') : undefined,
                        border: (value.goal_duration_style === 'clean') ? 'none' : (value.goal_duration_style === 'solid') ? `1px solid ${value.goal_duration_border_color || 'transparent'}` : undefined,
                        padding: (value.goal_duration_style === 'clean') ? '0' : '4px 14px',
                      }}
                    >
                      {value.goal_duration_show_icon !== 'false' && (
                        <Clock
                          size={Math.max(10, Math.round(Number(value.goal_duration_size || 13) * 0.92))}
                          className="goal-duration-icon"
                          style={{ color: value.goal_duration_color || '#60a5fa' }}
                        />
                      )}
                      <span>{formatGoalDuration(value.goal_end_date, value.goal_duration_text)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 5: Studio Stage Live Preview */}
      <div className="goal-studio-stage">
        <div className="goal-studio-stage-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="goal-studio-tag">
              <span className="goal-studio-pulse" />
              <span>LIVE OBS PREVIEW</span>
            </div>
            <span className="goal-studio-subtitle">
              ตัวอย่างยอดบริจาค 50% — จำลองภาพสตรีมจริง
            </span>
          </div>

          <div className="goal-backdrop-switcher">
            <span className="goal-backdrop-label">ฉากหลังจำลอง:</span>
            <button
              type="button"
              className={`goal-backdrop-btn${previewBackdrop === 'gaming' ? ' active' : ''}`}
              onClick={() => setPreviewBackdrop('gaming')}
              title="จำลองฉากสตรีมเกม"
            >
              <Gamepad2 size={13} />
              <span>เกมสตรีม</span>
            </button>
            <button
              type="button"
              className={`goal-backdrop-btn${previewBackdrop === 'neon' ? ' active' : ''}`}
              onClick={() => setPreviewBackdrop('neon')}
              title="จำลองกราเดียนต์สีสด"
            >
              <Palette size={13} />
              <span>นีออนสีสด</span>
            </button>
            <button
              type="button"
              className={`goal-backdrop-btn${previewBackdrop === 'checker' ? ' active' : ''}`}
              onClick={() => setPreviewBackdrop('checker')}
              title="ตารางโปร่งใส (Alpha)"
            >
              <Grid size={13} />
              <span>ตารางโปร่งใส</span>
            </button>
            <button
              type="button"
              className={`goal-backdrop-btn${previewBackdrop === 'dark' ? ' active' : ''}`}
              onClick={() => setPreviewBackdrop('dark')}
              title="มืดมาตรฐาน"
            >
              <Eye size={13} />
              <span>มืดสตูดิโอ</span>
            </button>
          </div>
        </div>

        <div className={`goal-studio-canvas backdrop-${previewBackdrop}`}>
          {previewBackdrop === 'gaming' && (
            <div className="canvas-gaming-elements" aria-hidden="true">
              <div className="gaming-decor-shape g-shape-1" />
              <div className="gaming-decor-shape g-shape-2" />
              <div className="gaming-decor-shape g-shape-3" />
              <div className="gaming-decor-grid" />
            </div>
          )}
          {previewBackdrop === 'neon' && (
            <div className="canvas-neon-elements" aria-hidden="true">
              <div className="neon-decor-orb n-orb-1" />
              <div className="neon-decor-orb n-orb-2" />
              <div className="neon-decor-orb n-orb-3" />
            </div>
          )}
          <GoalWidget
            title={title || 'ค่าอาหารหมา'}
            target={target}
            current={(Number.isFinite(target) && target > 0 ? target : 100) * 0.5}
            appearance={value}
          />
        </div>
      </div>
    </div>
  );
}
