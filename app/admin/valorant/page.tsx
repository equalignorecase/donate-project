'use client';

import React, { useEffect, useState } from 'react';
import { 
  Gamepad2, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCcw, 
  RefreshCw, 
  Sparkles, 
  Sliders, 
  Eye, 
  ShieldCheck, 
  Key, 
  Flame,
  Layers,
  Palette,
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  Users
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import ValorantCard from '@/app/overlay/valorant/ValorantCard';
import { ValorantSettings, ValorantRankData, ValorantAccountProfile } from '@/lib/types/valorant';
import { 
  valorantDefaults, 
  valorantThemes, 
  regionOptions, 
  valorantFontOptions, 
  readValorantSettings,
  parseValorantAccounts,
  getActiveAccount
} from '@/lib/valorantSettings';
import './valorant-admin.css';

export default function ValorantAdminPage() {
  const { showToast, handleUnauthorized } = useAdmin();

  // Settings State
  const [settings, setSettings] = useState<ValorantSettings>({ ...valorantDefaults });
  const [accounts, setAccounts] = useState<ValorantAccountProfile[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [resettingSession, setResettingSession] = useState<boolean>(false);
  
  // Test connection feedback
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Modal State for Add / Edit Account
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<ValorantAccountProfile | null>(null);
  const [accountForm, setAccountForm] = useState({
    label: '',
    name: '',
    tag: '',
    region: 'ap'
  });

  // Live preview rank data (defaults to demo mock until connected)
  const [previewData, setPreviewData] = useState<ValorantRankData>({
    name: 'Player',
    tag: '1234',
    currenttierpatched: 'Ascendant 2',
    currenttier: 21,
    ranking_in_tier: 17,
    elo: 1817,
    images: {
      small: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/smallicon.png',
      large: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/largeicon.png',
    },
    wins: 4,
    losses: 0,
    last_match_change: 18,
    updated_at: new Date().toISOString(),
  });

  const [previewBg, setPreviewBg] = useState<'checker' | 'game' | 'bright'>('game');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedAccId, setCopiedAccId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    setOrigin(window.location.origin);

    // Fetch existing settings
    fetch('/api/admin/settings')
      .then(async (res) => {
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          const loaded = readValorantSettings(data.settings);
          setSettings(loaded);

          let parsedAccs = parseValorantAccounts(loaded.valorant_accounts);

          // If no accounts yet, migrate legacy single-account into first account
          if (parsedAccs.length === 0 && loaded.valorant_name) {
            const initialAcc: ValorantAccountProfile = {
              id: 'acc_main',
              label: 'ไอดีหลัก',
              name: loaded.valorant_name,
              tag: loaded.valorant_tag,
              region: loaded.valorant_region || 'ap',
              session_reset_at: loaded.valorant_session_reset_at || '',
              created_at: new Date().toISOString()
            };
            parsedAccs = [initialAcc];
          }

          setAccounts(parsedAccs);

          const activeId = loaded.valorant_active_account_id || parsedAccs[0]?.id || '';
          setActiveAccountId(activeId);

          // If credentials present, fetch initial live rank
          const activeAcc = getActiveAccount(loaded, activeId);
          if (activeAcc.name && activeAcc.tag && loaded.valorant_api_key) {
            void fetchLiveRank(activeAcc.id);
          }
        }
      })
      .catch((err) => {
        console.warn('Load settings error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [handleUnauthorized]);

  const fetchLiveRank = async (targetAccId?: string) => {
    try {
      const url = targetAccId ? `/api/valorant?accountId=${encodeURIComponent(targetAccId)}` : '/api/valorant';
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setPreviewData(json.data);
      }
    } catch (e) {}
  };

  const handleInputChange = (field: keyof ValorantSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: keyof ValorantSettings) => {
    setSettings(prev => ({
      ...prev,
      [field]: prev[field] === 'true' ? 'false' : 'true',
    }));
  };

  const handleApplyPreset = (themeName: 'classic' | 'neon' | 'glass' | 'minimal') => {
    const preset = valorantThemes[themeName];
    if (preset) {
      setSettings(prev => ({
        ...prev,
        ...preset,
      }));
      showToast(`เปลี่ยนธีมเป็น "${themeName.toUpperCase()}" เรียบร้อย`);
    }
  };

  // Switch Active Account in 1 Click
  const handleSwitchActiveAccount = async (targetId: string) => {
    const target = accounts.find(a => a.id === targetId);
    if (!target) return;

    setActiveAccountId(target.id);
    const updatedSettings: ValorantSettings = {
      ...settings,
      valorant_active_account_id: target.id,
      valorant_name: target.name,
      valorant_tag: target.tag,
      valorant_region: target.region,
      valorant_session_reset_at: target.session_reset_at || '',
    };
    setSettings(updatedSettings);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (res.ok) {
        showToast(`สลับไปใช้งานบัญชี "${target.label}" (${target.name}#${target.tag}) สำเร็จ!`);
        void fetchLiveRank(target.id);
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการสลับบัญชี: ' + err.message);
    }
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setAccountForm({
      label: `ไอดีที่ ${accounts.length + 1}`,
      name: '',
      tag: '',
      region: 'ap'
    });
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (acc: ValorantAccountProfile) => {
    setEditingAccount(acc);
    setAccountForm({
      label: acc.label,
      name: acc.name,
      tag: acc.tag,
      region: acc.region || 'ap'
    });
    setModalOpen(true);
  };

  // Save Account from Modal
  const handleSaveAccountModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim() || !accountForm.tag.trim()) {
      showToast('กรุณากรอก Riot Nickname และ Tag ID');
      return;
    }

    let updatedAccounts: ValorantAccountProfile[] = [];
    let currentActiveId = activeAccountId;

    if (editingAccount) {
      updatedAccounts = accounts.map(a => {
        if (a.id === editingAccount.id) {
          return {
            ...a,
            label: accountForm.label.trim() || 'ไอดี Valorant',
            name: accountForm.name.trim(),
            tag: accountForm.tag.trim(),
            region: accountForm.region
          };
        }
        return a;
      });
    } else {
      const newAcc: ValorantAccountProfile = {
        id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label: accountForm.label.trim() || `ไอดีที่ ${accounts.length + 1}`,
        name: accountForm.name.trim(),
        tag: accountForm.tag.trim(),
        region: accountForm.region,
        session_reset_at: '',
        created_at: new Date().toISOString()
      };
      updatedAccounts = [...accounts, newAcc];
      if (updatedAccounts.length === 1) {
        currentActiveId = newAcc.id;
      }
    }

    setAccounts(updatedAccounts);
    setModalOpen(false);

    // Save to settings
    const activeAcc = updatedAccounts.find(a => a.id === currentActiveId) || updatedAccounts[0];
    const newSettingsState: ValorantSettings = {
      ...settings,
      valorant_accounts: JSON.stringify(updatedAccounts),
      valorant_active_account_id: activeAcc?.id || '',
      valorant_name: activeAcc?.name || settings.valorant_name,
      valorant_tag: activeAcc?.tag || settings.valorant_tag,
      valorant_region: activeAcc?.region || settings.valorant_region,
    };
    setSettings(newSettingsState);

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettingsState),
      });
      showToast(editingAccount ? 'แก้ไขข้อมูลบัญชีเรียบร้อยแล้ว' : 'เพิ่มบัญชีโปรดเรียบร้อยแล้ว');
      if (activeAcc) {
        void fetchLiveRank(activeAcc.id);
      }
    } catch (e: any) {
      showToast('เกิดข้อผิดพลาดในการบันทึก: ' + e.message);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return;
    if (!confirm(`ต้องการลบบัญชี "${acc.label}" (${acc.name}#${acc.tag}) หรือไม่?`)) return;

    const remaining = accounts.filter(a => a.id !== accId);
    setAccounts(remaining);

    let nextActiveId = activeAccountId;
    if (activeAccountId === accId) {
      nextActiveId = remaining[0]?.id || '';
      setActiveAccountId(nextActiveId);
    }

    const nextActiveAcc = remaining.find(a => a.id === nextActiveId);
    const newSettingsState: ValorantSettings = {
      ...settings,
      valorant_accounts: JSON.stringify(remaining),
      valorant_active_account_id: nextActiveId,
      valorant_name: nextActiveAcc?.name || '',
      valorant_tag: nextActiveAcc?.tag || '',
      valorant_region: nextActiveAcc?.region || 'ap',
    };
    setSettings(newSettingsState);

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettingsState),
      });
      showToast(`ลบบัญชี "${acc.label}" เรียบร้อยแล้ว`);
      if (nextActiveAcc) {
        void fetchLiveRank(nextActiveAcc.id);
      }
    } catch (e: any) {
      showToast('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  const handleTestConnection = async () => {
    const activeAcc = getActiveAccount(settings, activeAccountId);
    if (!activeAcc.name.trim() || !activeAcc.tag.trim()) {
      showToast('กรุณากรอก Riot Name และ Tag ของบัญชีที่ใช้งานก่อน');
      return;
    }
    if (!settings.valorant_api_key.trim()) {
      showToast('กรุณากรอก HenrikDev API Key ก่อน');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const query = new URLSearchParams({
        test: 'true',
        name: activeAcc.name.trim(),
        tag: activeAcc.tag.trim(),
        region: activeAcc.region || 'ap',
        apiKey: settings.valorant_api_key.trim(),
      });

      const res = await fetch(`/api/valorant?${query.toString()}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setPreviewData(json.data);
        setTestResult({
          success: true,
          message: `เชื่อมต่อสำเร็จ! พบผู้เล่น: ${json.data.name}#${json.data.tag} (${json.data.currenttierpatched} - ${json.data.ranking_in_tier}RR)`,
        });
        showToast('เชื่อมต่อ HenrikDev สำเร็จ ดึงข้อมูลเรียบร้อย!');
      } else {
        setTestResult({
          success: false,
          message: json.message || 'ไม่สามารถเชื่อมต่อได้ ตรวจสอบชื่อ/แท็ก หรือ API Key อีกครั้ง',
        });
        showToast('เชื่อมต่อไม่สำเร็จ: ' + (json.message || 'Error'));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'เครือข่ายขัดข้อง',
      });
      showToast('ทดสอบไม่สำเร็จ: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleResetSession = async () => {
    const activeAcc = getActiveAccount(settings, activeAccountId);
    if (!confirm(`ต้องการรีเซ็ตสถิติ Win/Loss ของบัญชี "${activeAcc.label}" (${activeAcc.name}#${activeAcc.tag}) เริ่มนับ 0/0 ใหม่หรือไม่?`)) {
      return;
    }

    setResettingSession(true);
    try {
      const res = await fetch('/api/admin/valorant/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: activeAcc.id })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // Update local accounts state
        const updatedAccounts = accounts.map(a => {
          if (a.id === activeAcc.id) {
            return { ...a, session_reset_at: json.reset_at };
          }
          return a;
        });
        setAccounts(updatedAccounts);
        setSettings(prev => ({ 
          ...prev, 
          valorant_session_reset_at: json.reset_at,
          valorant_accounts: JSON.stringify(updatedAccounts)
        }));
        setPreviewData(prev => ({ ...prev, wins: 0, losses: 0 }));
        showToast(`รีเซ็ตสถิติของบัญชี "${activeAcc.label}" เริ่มนับใหม่เรียบร้อยแล้ว`);
      } else {
        showToast('รีเซ็ตไม่สำเร็จ: ' + (json.message || 'Error'));
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setResettingSession(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const activeAcc = getActiveAccount(settings, activeAccountId);
    const payload: ValorantSettings = {
      ...settings,
      valorant_accounts: JSON.stringify(accounts),
      valorant_active_account_id: activeAccountId,
      valorant_name: activeAcc.name,
      valorant_tag: activeAcc.tag,
      valorant_region: activeAcc.region,
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('บันทึกการตั้งค่า Valorant ทั้งหมดเรียบร้อยแล้ว!');
      } else {
        showToast('บันทึกไม่สำเร็จ: ' + (json.message || 'Error'));
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const obsUrl = `${origin}/overlay/valorant`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(obsUrl);
    setCopied(true);
    showToast('คัดลอกลิงก์ OBS หลักเรียบร้อยแล้ว!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyAccountObsLink = (accId: string) => {
    const accUrl = `${origin}/overlay/valorant?accountId=${encodeURIComponent(accId)}`;
    navigator.clipboard.writeText(accUrl);
    setCopiedAccId(accId);
    showToast('คัดลอกลิงก์ OBS เฉพาะบัญชีนี้เรียบร้อยแล้ว!');
    setTimeout(() => setCopiedAccId(null), 2500);
  };

  const activeAcc = getActiveAccount(settings, activeAccountId);

  return (
    <div className="val-admin-container">
      {/* Top Header */}
      <div className="val-admin-header">
        <div className="val-admin-title-area">
          <div className="val-admin-icon">
            <Gamepad2 size={24} />
          </div>
          <div>
            <h1 className="val-admin-title">Valorant Rank Overlay</h1>
            <p className="val-admin-subtitle">
              จัดการหลายบัญชีโปรด สลับไอดีเล่นสดใน 1 คลิก พร้อมแสดงยศบน OBS แบบ Realtime
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="val-btn-primary"
            onClick={() => handleSave()}
            disabled={saving}
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="val-admin-grid">
        {/* Left Column: Accounts & Configuration */}
        <div className="val-main-col">
          {/* Card 1: Multi-Account Management & Quick Switcher */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Users size={18} color="var(--primary, #7C3AED)" />
                บัญชีโปรด & การสลับไอดี (Favorite Accounts)
              </span>

              <button
                type="button"
                className="btn sm"
                onClick={handleOpenAddModal}
              >
                <Plus size={14} />
                เพิ่มบัญชีโปรด
              </button>
            </div>

            {/* Quick Switcher Dropdown */}
            <div className="val-quick-switcher-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={20} color="var(--primary, #7C3AED)" />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                    สลับบัญชีที่กำลังเล่นสด (Active Stream Account)
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    จอ OBS ทุกจอที่ใช้ URL หลักจะเปลี่ยนตามไอดีที่เลือกทันที
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                <select
                  className="val-select"
                  style={{ width: '100%', fontWeight: 700, borderColor: 'var(--primary, #7C3AED)' }}
                  value={activeAccountId}
                  onChange={(e) => handleSwitchActiveAccount(e.target.value)}
                  disabled={accounts.length === 0}
                >
                  {accounts.length === 0 ? (
                    <option value="">ยังไม่มีบัญชีที่บันทึกไว้</option>
                  ) : (
                    accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.label} ({acc.name}#{acc.tag})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Accounts Table */}
            {accounts.length > 0 ? (
              <div className="val-accounts-table-wrap">
                <table className="val-accounts-table">
                  <thead>
                    <tr>
                      <th>ชื่อเล่นไอดี</th>
                      <th>Riot ID</th>
                      <th>เซิร์ฟเวอร์</th>
                      <th>สถานะ</th>
                      <th>OBS URL เฉพาะไอดี</th>
                      <th style={{ textAlign: 'right' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => {
                      const isActive = acc.id === activeAccountId;
                      return (
                        <tr key={acc.id} className={isActive ? 'active-row' : ''}>
                          <td style={{ fontWeight: 700 }}>
                            {acc.label}
                          </td>
                          <td>
                            <code style={{ fontSize: '13px', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                              {acc.name}#{acc.tag}
                            </code>
                          </td>
                          <td style={{ textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            {acc.region || 'ap'}
                          </td>
                          <td>
                            {isActive ? (
                              <span className="val-badge-active">
                                <Check size={12} />
                                ใช้งานอยู่ (Active)
                              </span>
                            ) : (
                              <span className="val-badge-inactive">
                                ไม่ได้ใช้งาน
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="val-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                              onClick={() => handleCopyAccountObsLink(acc.id)}
                              title="คัดลอก URL OBS สำหรับไอดีนี้โดยเฉพาะ"
                            >
                              {copiedAccId === acc.id ? <Check size={12} /> : <Copy size={12} />}
                              {copiedAccId === acc.id ? 'คัดลอกแล้ว' : 'คัดลอก URL'}
                            </button>
                          </td>
                          <td>
                            <div className="val-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                              {!isActive && (
                                <button
                                  type="button"
                                  className="btn sm"
                                  style={{ padding: '4px 10px', fontSize: '12px' }}
                                  onClick={() => handleSwitchActiveAccount(acc.id)}
                                >
                                  สลับใช้งาน
                                </button>
                              )}
                              <button
                                type="button"
                                className="val-btn-secondary"
                                style={{ padding: '5px 8px', borderRadius: '8px' }}
                                onClick={() => handleOpenEditModal(acc)}
                                title="แก้ไขข้อมูลบัญชี"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className="val-btn-danger"
                                style={{ padding: '5px 8px', borderRadius: '8px' }}
                                onClick={() => handleDeleteAccount(acc.id)}
                                title="ลบบัญชีนี้"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                ยังไม่มีบัญชีโปรดที่บันทึกไว้ กดปุ่ม &quot;เพิ่มบัญชีโปรด&quot; เพื่อเริ่มต้นบันทึกไอดี
              </div>
            )}
          </div>

          {/* Card 2: HenrikDev API Key Configuration */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Key size={18} color="var(--primary, #7C3AED)" />
                HenrikDev API Key (ใช้ร่วมกันทุกบัญชี)
              </span>
            </div>

            <div className="val-form-grid">
              <div className="val-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="val-label">HenrikDev API Key (ขึ้นต้นด้วย HDEV-...)</label>
                <input 
                  type="password" 
                  className="val-input"
                  placeholder="HDEV-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                  value={settings.valorant_api_key}
                  onChange={(e) => handleInputChange('valorant_api_key', e.target.value)}
                />
                <span className="val-help-text">
                  ยังไม่มี API Key? ขอรับฟรีได้ที่ Discord ของ HenrikDev หรือเว็บ{' '}
                  <a href="https://henrikdev.xyz" target="_blank" rel="noreferrer">
                    henrikdev.xyz
                  </a>
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="val-btn-secondary"
                onClick={handleTestConnection}
                disabled={testing || accounts.length === 0}
              >
                {testing ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} color="var(--primary, #7C3AED)" />}
                {testing ? 'กำลังทดสอบเชื่อมต่อ...' : `ทดสอบเชื่อมต่อไอดีปัจจุบัน (${activeAcc.label || activeAcc.name})`}
              </button>

              {testResult && (
                <div style={{ 
                  fontSize: '13px', 
                  color: testResult.success ? 'var(--success, #167650)' : 'var(--danger, #B42345)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {testResult.success ? <Check size={16} /> : null}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Win / Loss Session Control */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Flame size={18} color="#f97316" />
                การนับสถิติ Win / Loss ของบัญชีที่ใช้งาน ({activeAcc.label})
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              สถิติ Win/Loss ถูกแยกอิสระต่อบัญชี ระบบจะนับจากเกมที่เล่นในวันนี้ หากเริ่มสตรีมใหม่ต้องการนับ 0/0 สามารถกดปุ่มรีเซ็ตเฉพาะไอดีนี้ได้
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="val-btn-danger"
                onClick={handleResetSession}
                disabled={resettingSession || !activeAcc.name}
              >
                <RotateCcw size={14} />
                {resettingSession ? 'กำลังรีเซ็ต...' : `รีเซ็ต Session ของ "${activeAcc.label}" (เริ่ม 0 Win / 0 Loss)`}
              </button>

              {activeAcc.session_reset_at && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  รีเซ็ตล่าสุดเมื่อ: {new Date(activeAcc.session_reset_at).toLocaleTimeString('th-TH')}
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Display Toggles */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Sliders size={18} color="#3b82f6" />
                องค์ประกอบที่แสดงบน Overlay
              </span>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">รูปตราแรงก์ (Rank Tier Emblem)</span>
                <span className="val-toggle-desc">แสดงรูปสัญลักษณ์ยศ Valorant</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_badge === 'true'} 
                  onChange={() => handleToggle('valorant_show_badge')}
                />
                <span className="val-slider" />
              </label>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">ชื่อแรงก์ (Rank Name)</span>
                <span className="val-toggle-desc">เช่น Ascendant 2, Diamond 1, Immortal 3</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_rank === 'true'} 
                  onChange={() => handleToggle('valorant_show_rank')}
                />
                <span className="val-slider" />
              </label>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">แต้มคะแนน (Current RR)</span>
                <span className="val-toggle-desc">เช่น 17RR, 85RR</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_rr === 'true'} 
                  onChange={() => handleToggle('valorant_show_rr')}
                />
                <span className="val-slider" />
              </label>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">สถิติชนะ/แพ้ (Win / Loss)</span>
                <span className="val-toggle-desc">แสดงจำนวนแมตช์ที่ชนะและแพ้</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_wl === 'true'} 
                  onChange={() => handleToggle('valorant_show_wl')}
                />
                <span className="val-slider" />
              </label>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">ผลการแข่งเกมล่าสุด (+/- RR)</span>
                <span className="val-toggle-desc">ปุ่มแสดงแต้มที่บวกหรือลบจากเกมที่พึ่งจบไป</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_last_match === 'true'} 
                  onChange={() => handleToggle('valorant_show_last_match')}
                />
                <span className="val-slider" />
              </label>
            </div>

            {/* Custom Label for Last Match */}
            {settings.valorant_show_last_match === 'true' && (
              <div style={{ marginTop: '10px', padding: '12px 14px', background: 'var(--bg-subtle, #F0F1F6)', borderRadius: 'var(--radius-sm, 10px)' }}>
                <label className="val-label" style={{ marginBottom: '6px', display: 'block' }}>
                  ข้อความกำกับ (เช่น เกมล่าสุด, ตาที่แล้ว, Last Match)
                </label>
                <input 
                  type="text"
                  className="val-input"
                  style={{ width: '100%' }}
                  placeholder="เกมล่าสุด"
                  value={settings.valorant_last_match_label || ''}
                  onChange={(e) => handleInputChange('valorant_last_match_label', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Card 5: Appearance & Theming */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Palette size={18} color="#10b981" />
                ธีมและการปรับแต่งรูปลักษณ์ (Themes & Styling)
              </span>
            </div>

            {/* Presets */}
            <label className="val-label" style={{ marginBottom: '8px', display: 'block' }}>เลือกธีมสำเร็จรูป (Presets)</label>
            <div className="val-preset-grid">
              <button 
                type="button" 
                className={`val-preset-btn ${settings.valorant_theme === 'classic' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('classic')}
              >
                <span className="val-preset-icon">🎮</span>
                <span className="val-preset-name">Classic Dark</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>สไตล์ davizeragod</span>
              </button>

              <button 
                type="button" 
                className={`val-preset-btn ${settings.valorant_theme === 'neon' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('neon')}
              >
                <span className="val-preset-icon">⚡</span>
                <span className="val-preset-name">Cyber Neon</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>สีสันนีออนเด่นชัด</span>
              </button>

              <button 
                type="button" 
                className={`val-preset-btn ${settings.valorant_theme === 'glass' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('glass')}
              >
                <span className="val-preset-icon">💎</span>
                <span className="val-preset-name">Glassmorphism</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>กระจกฝ้าหรูหรา</span>
              </button>

              <button 
                type="button" 
                className={`val-preset-btn ${settings.valorant_theme === 'minimal' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('minimal')}
              >
                <span className="val-preset-icon">🖤</span>
                <span className="val-preset-name">Minimalist</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>เรียบง่ายไร้ขอบ</span>
              </button>
            </div>

            {/* Show Background Switch */}
            <div className="val-toggle-row" style={{ marginTop: '16px', paddingBottom: '14px', borderBottom: '1px dashed var(--border, #E2E5EE)' }}>
              <div className="val-toggle-info">
                <span className="val-toggle-title">แสดงพื้นหลังการ์ด (Card Background)</span>
                <span className="val-toggle-desc">หากปิด พื้นหลังจะโปร่งแสง 100% แสดงเฉพาะตัวหนังสือและไอคอนลอยบนจอสตรีม</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_bg !== 'false'} 
                  onChange={() => handleToggle('valorant_show_bg')}
                />
                <span className="val-slider" />
              </label>
            </div>

            {/* Shine Effect Switch */}
            <div className="val-toggle-row" style={{ paddingBottom: '16px', borderBottom: '1.5px solid var(--border, #E2E5EE)' }}>
              <div className="val-toggle-info">
                <span className="val-toggle-title">เอฟเฟกต์ประกายแสง (Text Shine Effect)</span>
                <span className="val-toggle-desc">ลำแสงประกายคริสตัลวิ่งพาดผ่านทั้งชื่อแรงก์และคะแนน RR ต่อเนื่องเป็นคลื่นเดียวกันทุก 3.5 วินาที</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_shine === 'true'} 
                  onChange={() => handleToggle('valorant_shine')}
                />
                <span className="val-slider" />
              </label>
            </div>

            {/* Color & Size Customization */}
            <div className="val-form-grid" style={{ marginTop: '20px' }}>
              <div 
                className="val-form-group"
                style={{ 
                  opacity: settings.valorant_show_bg === 'false' ? 0.4 : 1, 
                  pointerEvents: settings.valorant_show_bg === 'false' ? 'none' : 'auto',
                  transition: 'opacity 0.2s' 
                }}
              >
                <label className="val-label">สีพื้นหลังการ์ด (Card Background)</label>
                <div className="val-color-control">
                  <input 
                    type="color" 
                    className="val-color-picker"
                    value={settings.valorant_bg_color || '#1e293b'}
                    onChange={(e) => handleInputChange('valorant_bg_color', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="val-input"
                    style={{ flex: 1 }}
                    value={settings.valorant_bg_color}
                    onChange={(e) => handleInputChange('valorant_bg_color', e.target.value)}
                  />
                </div>
              </div>

              <div 
                className="val-form-group"
                style={{ 
                  opacity: settings.valorant_show_bg === 'false' ? 0.4 : 1, 
                  pointerEvents: settings.valorant_show_bg === 'false' ? 'none' : 'auto',
                  transition: 'opacity 0.2s' 
                }}
              >
                <label className="val-label">ความโปร่งแสงพื้นหลัง ({settings.valorant_bg_opacity}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.valorant_bg_opacity}
                  onChange={(e) => handleInputChange('valorant_bg_opacity', e.target.value)}
                  style={{ marginTop: '12px' }}
                />
              </div>

              <div className="val-form-group">
                <label className="val-label">สีข้อความหลัก (Text Color)</label>
                <div className="val-color-control">
                  <input 
                    type="color" 
                    className="val-color-picker"
                    value={settings.valorant_text_color || '#ffffff'}
                    onChange={(e) => handleInputChange('valorant_text_color', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="val-input"
                    style={{ flex: 1 }}
                    value={settings.valorant_text_color}
                    onChange={(e) => handleInputChange('valorant_text_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="val-form-group">
                <label className="val-label">สีเน้นไฮไลท์ (Accent Color)</label>
                <div className="val-color-control">
                  <input 
                    type="color" 
                    className="val-color-picker"
                    value={settings.valorant_accent_color || '#38bdf8'}
                    onChange={(e) => handleInputChange('valorant_accent_color', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="val-input"
                    style={{ flex: 1 }}
                    value={settings.valorant_accent_color}
                    onChange={(e) => handleInputChange('valorant_accent_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="val-form-group">
                <label className="val-label">ความโค้งมนขอบ ({settings.valorant_radius}px)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="32" 
                  value={settings.valorant_radius}
                  onChange={(e) => handleInputChange('valorant_radius', e.target.value)}
                  style={{ marginTop: '12px' }}
                />
              </div>

              <div className="val-form-group">
                <label className="val-label">ขนาดสเกล Overlay ({settings.valorant_scale}%)</label>
                <input 
                  type="range" 
                  min="70" 
                  max="150" 
                  value={settings.valorant_scale}
                  onChange={(e) => handleInputChange('valorant_scale', e.target.value)}
                  style={{ marginTop: '12px' }}
                />
              </div>

              <div className="val-form-group">
                <label className="val-label">รูปแบบฟอนต์ (Font Family)</label>
                <select 
                  className="val-select"
                  value={settings.valorant_font}
                  onChange={(e) => handleInputChange('valorant_font', e.target.value)}
                >
                  {valorantFontOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview & OBS URL (Sticky) */}
        <div className="val-preview-col">
          {/* Live Preview Box */}
          <div className="val-card" style={{ marginBottom: 0 }}>
            <div className="val-card-header">
              <span className="val-card-title">
                <Eye size={18} color="var(--primary, #7C3AED)" />
                ตัวอย่างสด ({activeAcc.label || 'Live Preview'})
              </span>

              {/* Background switch */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  type="button" 
                  className={`val-btn-secondary ${previewBg === 'game' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setPreviewBg('game')}
                >
                  Dark
                </button>
                <button 
                  type="button" 
                  className={`val-btn-secondary ${previewBg === 'checker' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setPreviewBg('checker')}
                >
                  Grid
                </button>
                <button 
                  type="button" 
                  className={`val-btn-secondary ${previewBg === 'bright' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setPreviewBg('bright')}
                >
                  Light
                </button>
              </div>
            </div>

            <div className={`val-preview-box ${previewBg}`}>
              <ValorantCard 
                data={previewData}
                settings={settings}
                loading={false}
              />
            </div>
          </div>

          {/* OBS Browser Source Box */}
          <div className="val-obs-box">
            <span className="val-card-title" style={{ marginBottom: '8px' }}>
              <Layers size={18} color="#3b82f6" />
              OBS Browser Source URL (สลับตามไอดีอัตโนมัติ)
            </span>

            <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', margin: '0 0 10px 0' }}>
              ใช้ URL นี้ใส่ใน OBS เพียงครั้งเดียว เมื่อคุณสลับไอดีในหน้านี้ จอ OBS จะเปลี่ยนตามทันที
            </p>

            <div className="val-obs-url-row">
              <input 
                type="text" 
                readOnly 
                className="val-obs-input"
                value={obsUrl}
              />
              <button 
                type="button" 
                className="val-btn-copy"
                onClick={handleCopyLink}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a 
                href={obsUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '12px', color: 'var(--primary, #7C3AED)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                เปิดดูหน้าต่าง Overlay จริง <ExternalLink size={12} />
              </a>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                ขนาดแนะนำ: 450 x 140 px
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add / Edit Account */}
      {modalOpen && (
        <div className="val-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="val-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="val-modal-header">
              <span className="val-modal-title">
                <Users size={18} color="var(--primary, #7C3AED)" />
                {editingAccount ? 'แก้ไขบัญชีโปรด' : 'เพิ่มบัญชีโปรดใหม่'}
              </span>
              <button
                type="button"
                className="val-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccountModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="val-form-group">
                <label className="val-label">ชื่อเล่นไอดี (เช่น ไอดีหลัก, Smurf ไต่แรงก์, เล่นกับเพื่อน)</label>
                <input
                  type="text"
                  className="val-input"
                  placeholder="เช่น ไอดีหลัก"
                  value={accountForm.label}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, label: e.target.value }))}
                  required
                />
              </div>

              <div className="val-form-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="val-form-group">
                  <label className="val-label">Riot Nickname</label>
                  <input
                    type="text"
                    className="val-input"
                    placeholder="เช่น cannabiz"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="val-form-group">
                  <label className="val-label">Tag ID (หลัง #)</label>
                  <input
                    type="text"
                    className="val-input"
                    placeholder="เช่น 9999"
                    value={accountForm.tag}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, tag: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="val-form-group">
                <label className="val-label">Region (เซิร์ฟเวอร์)</label>
                <select
                  className="val-select"
                  value={accountForm.region}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, region: e.target.value }))}
                >
                  {regionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="val-btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="val-btn-primary"
                >
                  <Check size={16} />
                  {editingAccount ? 'บันทึกการแก้ไข' : 'บันทึกบัญชี'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
