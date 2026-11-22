import { useRef, useState } from 'react';
import { Image as ImageIcon, QrCode, Palette, Sliders, Upload, Link2, Sparkles, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { goalFontOptions } from '@/lib/goalAppearance';
import { QrCardAppearance, qrCardDefaults, qrCardRanges } from '@/lib/qrCardAppearance';
import './goal-editor-premium.css';

type QrSubTab = 'content' | 'colors' | 'sizes';

const qrColors: [keyof QrCardAppearance, string][] = [
  ['qr_card_bg_color', 'พื้นหลังการ์ด'],
  ['qr_card_border_color', 'เส้นขอบการ์ด'],
  ['qr_card_title_color', 'สีข้อความหลัก'],
  ['qr_card_subtitle_color', 'สีข้อความรอง'],
  ['qr_card_badge_bg_color', 'พื้นหลังป้ายแท็ก (Badge)'],
  ['qr_card_badge_text_color', 'ตัวอักษรป้ายแท็ก'],
  ['qr_card_qr_fg_color', 'สีลายเส้น QR Code'],
  ['qr_card_qr_bg_color', 'สีพื้นหลัง QR Code'],
];

const qrSizes: [keyof QrCardAppearance, string, string][] = [
  ['qr_card_width', 'ความกว้างการ์ด', 'px'],
  ['qr_card_media_size', 'ขนาดรูป / QR Code', 'px'],
  ['qr_card_media_padding', 'ขอบขาวรอบ QR Code', 'px'],
  ['qr_card_media_radius', 'ความโค้งมุมรูป / QR', 'px'],
  ['qr_card_gap', 'ระยะห่างระหว่างรูปกับข้อความ (Gap)', 'px'],
  ['qr_card_text_gap', 'ระยะห่างระหว่างบรรทัดข้อความ', 'px'],
  ['qr_card_padding', 'ระยะขอบด้านในการ์ด (Padding)', 'px'],
  ['qr_card_radius', 'ความโค้งมุมการ์ด', 'px'],
  ['qr_card_title_size', 'ขนาดข้อความหลัก', 'px'],
  ['qr_card_subtitle_size', 'ขนาดข้อความรอง', 'px'],
  ['qr_card_opacity', 'ความทึบพื้นหลัง', '%'],
];

export default function QrCardAppearanceEditor({
  value,
  onChange,
  disabled,
  origin,
}: {
  value: QrCardAppearance;
  onChange: (next: QrCardAppearance) => void;
  disabled: boolean;
  origin: string;
}) {
  const [activeTab, setActiveTab] = useState<QrSubTab>('content');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const update = (key: keyof QrCardAppearance, next: string) => onChange({ ...value, [key]: next });

  const handleUploadImage = async (file: File) => {
    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload-media', { method: 'POST', body: formData });
      const result = await res.json();
      if (!res.ok || !result.success || !result.url) {
        throw new Error(result.message || 'อัปโหลดรูปไม่สำเร็จ');
      }
      onChange({
        ...value,
        qr_card_mode: 'image',
        qr_card_image_url: result.url,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="goal-editor">
      <div className="goal-editor-heading" style={{ marginBottom: '18px' }}>
        <div>
          <h2>ออกแบบการ์ดรูปภาพ &amp; QR Code</h2>
          <p>แสดงรูปภาพ หรือ QR Code ลิงก์หน้าโดเนท พร้อมข้อความ สีสัน และระยะห่างสำหรับ OBS</p>
        </div>
        <button
          className="widget-button widget-button-reset"
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...qrCardDefaults })}
        >
          คืนค่าเริ่มต้น
        </button>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="editor-subtabs" role="tablist" aria-label="หมวดหมู่การตั้งค่าการ์ด QR">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'content'}
          className={`editor-subtab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          <QrCode size={15} />
          <span>รูปภาพ, QR &amp; ข้อความ</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'colors'}
          className={`editor-subtab-btn ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          <Palette size={15} />
          <span>สีสันและขอบไฟรุ้ง</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sizes'}
          className={`editor-subtab-btn ${activeTab === 'sizes' ? 'active' : ''}`}
          onClick={() => setActiveTab('sizes')}
        >
          <Sliders size={15} />
          <span>ขนาดและระยะห่าง</span>
        </button>
      </div>

      {/* Tab 1: Content & Media */}
      {activeTab === 'content' && (
        <>
          <fieldset disabled={disabled} className="goal-editor-controls">
            <legend>แหล่งที่มาของรูป / QR Code</legend>
            <div className="settings-segmented" style={{ marginBottom: '16px', minHeight: '44px' }}>
              <button
                type="button"
                className={`settings-segmented-btn ${value.qr_card_mode !== 'image' ? 'active' : ''}`}
                onClick={() => update('qr_card_mode', 'qr')}
              >
                <QrCode size={15} />
                <span>สร้าง QR Code จากลิงก์อัตโนมัติ</span>
              </button>
              <button
                type="button"
                className={`settings-segmented-btn ${value.qr_card_mode === 'image' ? 'active' : ''}`}
                onClick={() => update('qr_card_mode', 'image')}
              >
                <ImageIcon size={15} />
                <span>ใช้รูปภาพ (อัปโหลด / URL)</span>
              </button>
            </div>

            {value.qr_card_mode !== 'image' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="goal-font-control" style={{ margin: 0 }}>
                  <span>ลิงก์ที่ต้องการแปลงเป็น QR Code (เว้นว่างจะใช้ลิงก์หน้าโดเนทของเว็บให้อัตโนมัติ)</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="url"
                      value={value.qr_card_qr_url}
                      onChange={e => update('qr_card_qr_url', e.target.value)}
                      placeholder={origin ? `${origin}/donate` : 'https://.../donate'}
                      style={{ flex: 1, minWidth: '220px' }}
                    />
                    <button
                      type="button"
                      className="widget-button widget-button-copy"
                      onClick={() => update('qr_card_qr_url', origin ? `${origin}/donate` : '')}
                      style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Link2 size={14} />
                      <span>ใช้ลิงก์ /donate</span>
                    </button>
                  </div>
                </label>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="goal-font-control" style={{ margin: 0 }}>
                  <span>ลิงก์รูปภาพ หรือ อัปโหลดจากเครื่อง (PNG, JPG, GIF, WEBP)</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={value.qr_card_image_url}
                      onChange={e => update('qr_card_image_url', e.target.value)}
                      placeholder="https://... หรืออัปโหลดไฟล์รูป"
                      style={{ flex: 1, minWidth: '220px' }}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadImage(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      className="widget-button widget-button-month"
                      disabled={disabled || uploading}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} />
                      <span>{uploading ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}</span>
                    </button>
                  </div>
                </label>
                {uploadError && <div style={{ color: '#f87171', fontSize: '12.5px' }}>{uploadError}</div>}
              </div>
            )}
          </fieldset>

          <fieldset disabled={disabled} className="goal-editor-controls">
            <legend>ข้อความและรูปแบบการจัดวาง</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <label className="goal-font-control" style={{ margin: 0 }}>
                <span>ป้ายแท็กด้านบน (Badge)</span>
                <input
                  value={value.qr_card_badge_text}
                  onChange={e => update('qr_card_badge_text', e.target.value)}
                  maxLength={60}
                  placeholder="SCAN TO DONATE"
                />
              </label>
              <label className="goal-font-control" style={{ margin: 0 }}>
                <span>ข้อความหลัก (Title)</span>
                <input
                  value={value.qr_card_title}
                  onChange={e => update('qr_card_title', e.target.value)}
                  maxLength={160}
                  placeholder="สแกนเพื่อโดเนทสนับสนุน"
                />
              </label>
              <label className="goal-font-control" style={{ margin: 0 }}>
                <span>ข้อความรอง / คำอธิบาย (Subtitle)</span>
                <input
                  value={value.qr_card_subtitle}
                  onChange={e => update('qr_card_subtitle', e.target.value)}
                  maxLength={240}
                  placeholder="PromptPay / TrueMoney ขึ้นจอทันที"
                />
              </label>
            </div>

            <div className="goal-control-grid" style={{ marginBottom: '16px' }}>
              <label className="goal-font-control">
                การจัดวาง (Layout)
                <select value={value.qr_card_layout} onChange={e => update('qr_card_layout', e.target.value)}>
                  <option value="vertical">แนวตั้ง (รูป/QR ด้านบน + ข้อความด้านล่าง)</option>
                  <option value="horizontal">แนวนอน (รูป/QR ด้านซ้าย + ข้อความด้านขวา)</option>
                </select>
              </label>
              <label className="goal-font-control">
                ฟอนต์ตัวอักษร
                <select value={value.qr_card_font} onChange={e => update('qr_card_font', e.target.value)}>
                  {goalFontOptions.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                การจัดแนวข้อความ (Text Align)
              </span>
              <div className="settings-segmented" style={{ maxWidth: '320px' }}>
                {([
                  ['left', 'ชิดซ้าย', AlignLeft],
                  ['center', 'กึ่งกลาง', AlignCenter],
                  ['right', 'ชิดขวา', AlignRight],
                ] as const).map(([alignKey, label, Icon]) => (
                  <button
                    key={alignKey}
                    type="button"
                    className={`settings-segmented-btn ${value.qr_card_text_align === alignKey ? 'active' : ''}`}
                    onClick={() => update('qr_card_text_align', alignKey)}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="goal-toggle-grid">
              {([
                ['qr_card_show_bg', 'แสดงพื้นหลังการ์ด'],
                ['qr_card_show_border', 'แสดงกรอบการ์ด'],
                ['qr_card_show_badge', 'แสดงป้ายแท็ก (Badge)'],
                ['qr_card_show_title', 'แสดงข้อความหลัก'],
                ['qr_card_show_subtitle', 'แสดงข้อความรอง'],
              ] as [keyof QrCardAppearance, string][]).map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={value[key] !== 'false'}
                    onChange={e => update(key, String(e.target.checked))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {/* Tab 2: Colors & Rainbow */}
      {activeTab === 'colors' && (
        <>
          <div
            className={`goal-switch-card ${value.qr_card_rainbow_border === 'true' ? 'active' : ''}`}
            style={{
              marginBottom: '16px',
              background: value.qr_card_rainbow_border === 'true'
                ? 'linear-gradient(135deg, rgba(255,0,85,0.12), rgba(0,204,255,0.12))'
                : undefined,
              border: value.qr_card_rainbow_border === 'true' ? '1px solid rgba(255,0,85,0.35)' : undefined,
            }}
            onClick={() => {
              if (disabled) return;
              const next = value.qr_card_rainbow_border === 'true' ? 'false' : 'true';
              onChange({
                ...value,
                qr_card_rainbow_border: next,
                ...(next === 'true' ? { qr_card_show_border: 'true' } : {}),
              });
            }}
            role="checkbox"
            aria-checked={value.qr_card_rainbow_border === 'true'}
          >
            <div>
              <span className="goal-switch-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} />
                <span>🌈 ขอบไฟสายรุ้งเคลื่อนไหว (Animated Rainbow Border)</span>
              </span>
              <p className="goal-switch-desc">
                เพิ่มขอบแสงสีรุ้ง RGB ไหลรอบการ์ด QR / รูปภาพ โดดเด่นสะดุดตาบน OBS
              </p>
            </div>
            <div className="goal-switch-track">
              <div className="goal-switch-thumb" />
            </div>
          </div>

          <fieldset disabled={disabled} className="goal-editor-controls">
            <legend>เอฟเฟกต์ลำแสงวิ่งพาดผ่านการ์ด (Shine Sweep)</legend>
            <div className="goal-toggle-grid" style={{ marginBottom: value.qr_card_shine_sweep !== 'false' ? '14px' : 0 }}>
              <label>
                <input
                  type="checkbox"
                  checked={value.qr_card_shine_sweep !== 'false'}
                  onChange={e => update('qr_card_shine_sweep', String(e.target.checked))}
                />
                <span>เปิดลำแสงวิ่งพาดผ่านการ์ด + ออร่าข้อความหลัก</span>
              </label>
            </div>
            {value.qr_card_shine_sweep !== 'false' && (
              <div className="goal-control-grid">
                <label className="goal-font-control">
                  โทนสีลำแสงวิ่ง
                  <select
                    value={value.qr_card_shine_theme || 'crystal'}
                    onChange={e => update('qr_card_shine_theme', e.target.value)}
                  >
                    <option value="crystal">💎 คริสตัลประกายเพชร (Crystal)</option>
                    <option value="gold">🏆 ประกายทอง (Golden Glow)</option>
                    <option value="cyan">⚡ นีออนไซแอน (Cyber Cyan)</option>
                    <option value="rose">🌸 โรสพิงค์ (Rose Pink)</option>
                    <option value="emerald">💚 เอเมอรัลด์ (Emerald)</option>
                    <option value="rainbow">🌈 สายรุ้ง (Rainbow)</option>
                  </select>
                </label>
                <label className="goal-range-control">
                  <span>
                    หน่วงเวลาหยุดพักก่อนวิ่งรอบใหม่
                    <strong>{value.qr_card_shine_delay || '3'} วินาที</strong>
                  </span>
                  <input
                    type="range"
                    min={qrCardRanges.qr_card_shine_delay?.[0] ?? 1}
                    max={qrCardRanges.qr_card_shine_delay?.[1] ?? 15}
                    step={1}
                    value={value.qr_card_shine_delay || '3'}
                    onChange={e => update('qr_card_shine_delay', e.target.value)}
                  />
                </label>
              </div>
            )}
          </fieldset>

          <fieldset disabled={disabled} className="goal-editor-controls">
            <legend>กำหนดสีสันทุกส่วน</legend>
            <div className="goal-color-grid">
              {qrColors.map(([key, label]) => (
                <label className="goal-color-item" key={key}>
                  <span className="goal-color-label">{label}</span>
                  <div className="goal-swatch-wrapper">
                    <div className="goal-color-preview-circle" style={{ backgroundColor: value[key] }}>
                      <input
                        type="color"
                        className="goal-color-input-hidden"
                        aria-label={label}
                        value={value[key]}
                        onChange={e => update(key, e.target.value)}
                      />
                    </div>
                    <span className="goal-hex-badge">{value[key].toUpperCase()}</span>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {/* Tab 3: Sizes & Spacing */}
      {activeTab === 'sizes' && (
        <fieldset disabled={disabled} className="goal-editor-controls">
          <legend>ขนาดและระยะห่าง (Spacing &amp; Dimensions)</legend>
          <div className="goal-control-grid">
            {qrSizes.map(([key, label, unit]) => {
              const [min, max] = qrCardRanges[key]!;
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
                    onChange={e => update(key, e.target.value)}
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
