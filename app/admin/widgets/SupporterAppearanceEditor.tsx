import { useState } from 'react';
import { Palette, Grid, Sliders } from 'lucide-react';
import { goalFontOptions } from '@/lib/goalAppearance';
import { SupporterAppearance, supporterDefaults, supporterModes, supporterRanges } from '@/lib/supporterAppearance';
import './goal-editor-premium.css';

type SupporterSubTab = 'general' | 'colors' | 'sizes';

const colors: [keyof SupporterAppearance, string][] = [
  ['supporter_bg_color', 'พื้นหลังการ์ด'],
  ['supporter_text_color', 'ชื่อและข้อความ'],
  ['supporter_amount_color', 'ยอดบริจาค'],
  ['supporter_border_color', 'ขอบการ์ดและเส้นแบ่ง'],
  ['supporter_row_color', 'พื้นหลังรายการ'],
  ['supporter_rank_color', 'หมายเลขอันดับ'],
  ['supporter_rank_bg_color', 'พื้นหลังหมายเลขอันดับ']
];

const sizes: [keyof SupporterAppearance, string, string][] = [
  ['supporter_width', 'ความกว้างการ์ด', 'px'],
  ['supporter_padding', 'ระยะขอบด้านใน', 'px'],
  ['supporter_radius', 'ความโค้งการ์ด', 'px'],
  ['supporter_title_size', 'ขนาดหัวข้อ', 'px'],
  ['supporter_name_size', 'ขนาดชื่อ', 'px'],
  ['supporter_amount_size', 'ขนาดยอดเงิน', 'px'],
  ['supporter_row_gap', 'ระยะห่างรายการ', 'px'],
  ['supporter_opacity', 'ความทึบพื้นหลัง', '%'],
  ['supporter_limit', 'จำนวนรายการสูงสุด', 'คน']
];

const bgPresets = [
  { label: 'สีกรมเข้มดั้งเดิม', color: '#0f172a' },
  { label: 'ดำมิดไนท์', color: '#09090b' },
  { label: 'ม่วงไซเบอร์', color: '#180b28' },
  { label: 'เขียวมรกตเข้ม', color: '#062118' },
  { label: 'น้ำเงินเข้ม', color: '#0a192f' },
  { label: 'แดงทับทิมเข้ม', color: '#1f0d14' },
];

export default function SupporterAppearanceEditor({
  value,
  onChange,
  disabled
}: {
  value: SupporterAppearance;
  onChange: (next: SupporterAppearance) => void;
  disabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState<SupporterSubTab>('general');
  const update = (key: keyof SupporterAppearance, next: string) => onChange({ ...value, [key]: next });

  return (
    <div className="supporter-editor">
      <div className="goal-editor-heading" style={{ marginBottom: '18px' }}>
        <div>
          <h2>ตั้งค่าอันดับผู้โดเนท</h2>
          <p>ตั้งรูปแบบสำหรับรายชื่อล่าสุดและอันดับรายวัน รายเดือน ตลอดเวลา — พรีวิวสดบน OBS ฝั่งขวา</p>
        </div>
        <button
          className="widget-button widget-button-total"
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...supporterDefaults })}
        >
          คืนค่าเริ่มต้น
        </button>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="editor-subtabs">
        <button
          type="button"
          className={`editor-subtab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Grid size={15} />
          <span>รูปแบบ &amp; การแสดงผล</span>
        </button>
        <button
          type="button"
          className={`editor-subtab-btn ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          <Palette size={15} />
          <span>ชุดสี &amp; แสงวิ่ง</span>
        </button>
        <button
          type="button"
          className={`editor-subtab-btn ${activeTab === 'sizes' ? 'active' : ''}`}
          onClick={() => setActiveTab('sizes')}
        >
          <Sliders size={15} />
          <span>ขนาด &amp; ระยะห่าง</span>
        </button>
      </div>

      {/* Tab 1: General & Display Options */}
      {activeTab === 'general' && (
        <>
          <fieldset disabled={disabled} className="goal-editor-controls">
            <legend>ข้อมูลและรูปแบบรายการ</legend>
            <div className="goal-control-grid">
              <label className="goal-font-control">
                โหมดเริ่มต้น
                <select value={value.supporter_mode} onChange={event => update('supporter_mode', event.target.value)}>
                  {Object.entries(supporterModes).map(([mode, label]) => (
                    <option key={mode} value={mode}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="goal-font-control">
                ฟอนต์ตัวอักษร
                <select value={value.supporter_font} onChange={event => update('supporter_font', event.target.value)}>
                  {goalFontOptions.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </label>

              <label className="goal-font-control">
                รูปแบบรายการ
                <select value={value.supporter_layout} onChange={event => update('supporter_layout', event.target.value)}>
                  <option value="list">รายการพร้อมเส้นแบ่ง</option>
                  <option value="cards">กล่องแยกแต่ละคน</option>
                </select>
              </label>

              <label>
                หัวข้อกำหนดเอง
                <input
                  maxLength={160}
                  value={value.supporter_title}
                  placeholder="เว้นว่างเพื่อใช้หัวข้อตามโหมด"
                  onChange={event => update('supporter_title', event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset disabled={disabled} className="goal-editor-controls">
            <legend>การแสดงผลองค์ประกอบ</legend>
            <div className="goal-toggle-grid">
              {([
                ['supporter_show_bg', 'แสดงพื้นหลังการ์ด'],
                ['supporter_show_border', 'แสดงขอบการ์ด'],
                ['supporter_show_divider', 'แสดงเส้นแบ่งรายการ'],
                ['supporter_show_title', 'แสดงหัวข้อ'],
                ['supporter_show_amount', 'แสดงยอดเงิน'],
                ['supporter_show_rank', 'แสดงหมายเลขอันดับ'],
                ['supporter_show_rank_bg', 'แสดงพื้นหลังหมายเลขอันดับ']
              ] as [keyof SupporterAppearance, string][]).map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={value[key] === 'true'}
                    onChange={event => update(key, String(event.target.checked))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {/* Tab 2: Colors & Shine Sweep */}
      {activeTab === 'colors' && (
        <>
          <fieldset disabled={disabled} className="goal-editor-controls">
            <legend>สีและธีมพื้นหลัง</legend>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                พรีเซ็ตสีพื้นหลังการ์ดด่วน:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {bgPresets.map(preset => {
                  const isSelected = value.supporter_bg_color.toLowerCase() === preset.color.toLowerCase();
                  return (
                    <button
                      key={preset.color}
                      type="button"
                      disabled={disabled}
                      onClick={() => update('supporter_bg_color', preset.color)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        background: isSelected ? 'rgba(37, 99, 235, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.4)' : undefined,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: preset.color,
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          flexShrink: 0,
                        }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="goal-control-grid">
              {colors.map(([key, label]) => (
                <label className="goal-color-control" key={key}>
                  <span>{label}</span>
                  <div>
                    <input
                      type="color"
                      aria-label={label}
                      value={value[key]}
                      onChange={event => update(key, event.target.value)}
                    />
                    <code>{value[key]}</code>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={disabled} className="goal-editor-controls">
            <legend>ลำแสงวิ่งพาดผ่านตัวอักษร (Text Shine Sweep)</legend>
            <div className="goal-toggle-grid" style={{ marginBottom: value.supporter_shine_sweep !== 'false' ? '12px' : 0 }}>
              <label>
                <input
                  type="checkbox"
                  checked={value.supporter_shine_sweep !== 'false'}
                  onChange={event => update('supporter_shine_sweep', String(event.target.checked))}
                />
                <span>เปิดลำแสงวิ่งพาดผ่านตัวอักษรชื่อและยอดเงิน</span>
              </label>
            </div>
            {value.supporter_shine_sweep !== 'false' && (
              <div className="goal-control-grid">
                <label className="goal-font-control">
                  โทนสีลำแสงวิ่ง
                  <select
                    value={value.supporter_shine_theme || 'crystal'}
                    onChange={event => update('supporter_shine_theme', event.target.value)}
                  >
                    <option value="crystal">💎 คริสตัลประกายเพชร (Crystal Diamond)</option>
                    <option value="gold">🏆 ประกายทองพรีเมียม (Golden Glow)</option>
                    <option value="cyan">⚡ นีออนไซแอน (Cyber Cyan)</option>
                  </select>
                </label>
                <label className="goal-range-control">
                  <span>
                    หน่วงเวลาหยุดพักก่อนเริ่มรอบใหม่
                    <strong>{value.supporter_shine_delay || '4'} วินาที</strong>
                  </span>
                  <input
                    type="range"
                    min={supporterRanges.supporter_shine_delay?.[0] ?? 2}
                    max={supporterRanges.supporter_shine_delay?.[1] ?? 20}
                    step={1}
                    value={value.supporter_shine_delay || '4'}
                    onChange={event => update('supporter_shine_delay', event.target.value)}
                  />
                </label>
              </div>
            )}
          </fieldset>
        </>
      )}

      {/* Tab 3: Sizes & Ranges */}
      {activeTab === 'sizes' && (
        <fieldset disabled={disabled} className="goal-editor-controls">
          <legend>ขนาดและมิติสัดส่วน</legend>
          <div className="goal-control-grid">
            {sizes.map(([key, label, unit]) => {
              const [min, max] = supporterRanges[key]!;
              return (
                <label className="goal-range-control" key={key}>
                  <span>
                    {label}
                    <strong>{value[key]} {unit}</strong>
                  </span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={value[key]}
                    onChange={event => update(key, event.target.value)}
                  />
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
