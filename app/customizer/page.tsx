'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '../admin/admin.css';
import '../overlay/overlay.css';
import '../overlay/widgets.css';
import './customizer.css';
import { AlertSettings } from '@/lib/types/database';
import { Sidebar, MobileTopBar } from '@/app/components';
import AlertCard, { getAlertTier, TEXT_GRADIENT_PRESETS } from '@/app/overlay/alert/AlertCard';
import { amountToThaiWords } from '@/lib/thaiNumber';
import { ALERT_SOUND_PRESETS } from '@/lib/constants';
import {
  Palette,
  Type,
  Coins,
  Volume2,
  RotateCcw,
  Send,
  Save,
  Eye,
  Sliders,
  Play,
  Link2,
  Copy,
  LayoutTemplate,
  SquareDashed,
  Upload,
  Sun,
  Moon,
  Smartphone,
  Sparkles
} from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
  gift: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"></polyline>
      <rect x="2" y="7" width="20" height="5"></rect>
      <line x1="12" y1="22" x2="12" y2="7"></line>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
  ),
  heart: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  coin: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
      <path d="M12 6v2m0 8v2"></path>
    </svg>
  ),
  star: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  fire: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
    </svg>
  ),
  trophy: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
    </svg>
  )
};

const PRESETS: Record<string, Partial<AlertSettings>> = {
  frameless_clear: {
    alert_theme: 'frameless_clear',
    alert_font: 'LINESeedSansTH',
    alert_card_bg: 'transparent',
    alert_card_blur: 0,
    alert_card_width: 580,
    alert_border_color: 'transparent',
    alert_border_width: 0,
    alert_border_radius: 0,
    alert_shimmer_color: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
    alert_shimmer_show: 'false',
    alert_icon: 'gift',
    alert_icon_bg: 'transparent',
    alert_icon_color: '#38bdf8',
    alert_icon_border: 'transparent',
    alert_name_color: '#38bdf8',
    alert_action_text: 'โดเนทให้',
    alert_action_color: '#e2e8f0',
    alert_title_size: 28,
    alert_amount_bg: 'transparent',
    alert_amount_color: '#22c55e',
    alert_amount_border: 'transparent',
    alert_amount_size: 26,
    alert_msg_bg: 'transparent',
    alert_msg_color: '#ffffff',
    alert_msg_border: 'transparent',
    alert_msg_size: 18,
    alert_animation: 'slide-down',
    alert_glow: 'false',
    alert_shadow_show: 'false'
  },
  modern_light: {
    alert_theme: 'modern_light',
    alert_font: 'LINESeedSansTH',
    alert_card_bg: '#ffffff',
    alert_card_blur: 0,
    alert_card_width: 580,
    alert_border_color: '#e2e8f0',
    alert_border_width: 1.5,
    alert_border_radius: 24,
    alert_shimmer_color: 'linear-gradient(90deg, #0f172a 0%, #2563eb 50%, #059669 100%)',
    alert_shimmer_show: 'true',
    alert_icon: 'gift',
    alert_icon_bg: '#f8fafc',
    alert_icon_color: '#0f172a',
    alert_icon_border: '#e2e8f0',
    alert_name_color: '#0f172a',
    alert_action_text: 'โดเนทให้',
    alert_action_color: '#64748b',
    alert_title_size: 26,
    alert_amount_bg: '#ecfdf5',
    alert_amount_color: '#059669',
    alert_amount_border: '#a7f3d0',
    alert_amount_size: 22,
    alert_msg_bg: '#f8fafc',
    alert_msg_color: '#334155',
    alert_msg_border: '#e2e8f0',
    alert_msg_size: 18,
    alert_animation: 'slide-down',
    alert_glow: 'false',
    alert_shadow_show: 'true'
  },
  dark_luxury: {
    alert_theme: 'dark_luxury',
    alert_font: 'LINESeedSansTH-ExtraBold',
    alert_card_bg: '#0f172a',
    alert_card_blur: 0,
    alert_card_width: 580,
    alert_border_color: '#334155',
    alert_border_width: 2,
    alert_border_radius: 24,
    alert_shimmer_color: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)',
    alert_shimmer_show: 'true',
    alert_icon: 'trophy',
    alert_icon_bg: '#1e293b',
    alert_icon_color: '#fbbf24',
    alert_icon_border: '#b45309',
    alert_name_color: '#f8fafc',
    alert_action_text: 'โดเนทให้',
    alert_action_color: '#94a3b8',
    alert_title_size: 26,
    alert_amount_bg: '#451a03',
    alert_amount_color: '#fbbf24',
    alert_amount_border: '#b45309',
    alert_amount_size: 22,
    alert_msg_bg: '#1e293b',
    alert_msg_color: '#e2e8f0',
    alert_msg_border: '#334155',
    alert_msg_size: 18,
    alert_animation: 'slide-down',
    alert_glow: 'true',
    alert_shadow_show: 'true'
  },
  cyber_neon: {
    alert_theme: 'cyber_neon',
    alert_font: 'LINESeedSansTH-ExtraBold',
    alert_card_bg: '#090d16',
    alert_card_blur: 0,
    alert_card_width: 600,
    alert_border_color: '#06b6d4',
    alert_border_width: 2,
    alert_border_radius: 14,
    alert_shimmer_color: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
    alert_shimmer_show: 'true',
    alert_icon: 'fire',
    alert_icon_bg: '#0f172a',
    alert_icon_color: '#38bdf8',
    alert_icon_border: '#06b6d4',
    alert_name_color: '#f43f5e',
    alert_action_text: 'ส่งพลังโดเนท!',
    alert_action_color: '#38bdf8',
    alert_title_size: 26,
    alert_amount_bg: '#1e1b4b',
    alert_amount_color: '#38bdf8',
    alert_amount_border: '#818cf8',
    alert_amount_size: 24,
    alert_msg_bg: '#0f172a',
    alert_msg_color: '#e0e7ff',
    alert_msg_border: '#334155',
    alert_msg_size: 18,
    alert_animation: 'bounce',
    alert_glow: 'true',
    alert_shadow_show: 'true'
  },
  sweet_pastel: {
    alert_theme: 'sweet_pastel',
    alert_font: 'LINESeedSansTH',
    alert_card_bg: '#fff5f7',
    alert_card_blur: 0,
    alert_card_width: 560,
    alert_border_color: '#fecdd3',
    alert_border_width: 2,
    alert_border_radius: 28,
    alert_shimmer_color: 'linear-gradient(90deg, #f43f5e 0%, #fb7185 50%, #fda4af 100%)',
    alert_shimmer_show: 'true',
    alert_icon: 'heart',
    alert_icon_bg: '#ffe4e6',
    alert_icon_color: '#e11d48',
    alert_icon_border: '#fecdd3',
    alert_name_color: '#9f1239',
    alert_action_text: 'ส่งหัวใจให้แล้ว!',
    alert_action_color: '#fb7185',
    alert_title_size: 26,
    alert_amount_bg: '#fce7f3',
    alert_amount_color: '#be185d',
    alert_amount_border: '#f472b6',
    alert_amount_size: 22,
    alert_msg_bg: '#ffffff',
    alert_msg_color: '#881337',
    alert_msg_border: '#fecdd3',
    alert_msg_size: 18,
    alert_animation: 'bounce',
    alert_glow: 'false',
    alert_shadow_show: 'true'
  },
  glass_frost: {
    alert_theme: 'glass_frost',
    alert_font: 'LINESeedSansTH',
    alert_card_bg: 'rgba(255, 255, 255, 0.75)',
    alert_card_blur: 16,
    alert_card_width: 580,
    alert_border_color: 'rgba(255, 255, 255, 0.7)',
    alert_border_width: 2,
    alert_border_radius: 24,
    alert_shimmer_color: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
    alert_shimmer_show: 'true',
    alert_icon: 'coin',
    alert_icon_bg: '#eff6ff',
    alert_icon_color: '#2563eb',
    alert_icon_border: '#bfdbfe',
    alert_name_color: '#1e3a8a',
    alert_action_text: 'สนับสนุน',
    alert_action_color: '#60a5fa',
    alert_title_size: 26,
    alert_amount_bg: '#dbeafe',
    alert_amount_color: '#1d4ed8',
    alert_amount_border: '#93c5fd',
    alert_amount_size: 22,
    alert_msg_bg: 'rgba(255, 255, 255, 0.5)',
    alert_msg_color: '#1e293b',
    alert_msg_border: 'rgba(255, 255, 255, 0.6)',
    alert_msg_size: 18,
    alert_animation: 'zoom',
    alert_glow: 'false',
    alert_shadow_show: 'true'
  },
  pure_clear: {
    alert_theme: 'pure_clear',
    alert_font: 'LINESeedSansTH',
    alert_card_bg: 'transparent',
    alert_card_blur: 0,
    alert_card_width: 580,
    alert_border_color: 'rgba(255, 255, 255, 0.45)',
    alert_border_width: 1.5,
    alert_border_radius: 24,
    alert_shimmer_color: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
    alert_shimmer_show: 'true',
    alert_icon: 'star',
    alert_icon_bg: 'rgba(255, 255, 255, 0.15)',
    alert_icon_color: '#38bdf8',
    alert_icon_border: 'rgba(255, 255, 255, 0.3)',
    alert_name_color: '#ffffff',
    alert_action_text: 'เปย์กำลังใจ!',
    alert_action_color: '#94a3b8',
    alert_title_size: 26,
    alert_amount_bg: 'rgba(255, 255, 255, 0.15)',
    alert_amount_color: '#38bdf8',
    alert_amount_border: 'rgba(56, 189, 248, 0.5)',
    alert_amount_size: 24,
    alert_msg_bg: 'rgba(0, 0, 0, 0.25)',
    alert_msg_color: '#f8fafc',
    alert_msg_border: 'rgba(255, 255, 255, 0.2)',
    alert_msg_size: 18,
    alert_animation: 'bounce',
    alert_glow: 'true',
    alert_shadow_show: 'true'
  },
  dark_glass: {
    alert_theme: 'dark_glass',
    alert_font: 'LINESeedSansTH-ExtraBold',
    alert_card_bg: 'rgba(15, 23, 42, 0.65)',
    alert_card_blur: 16,
    alert_card_width: 600,
    alert_border_color: '#06b6d4',
    alert_border_width: 2,
    alert_border_radius: 20,
    alert_shimmer_color: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)',
    alert_shimmer_show: 'true',
    alert_icon: 'fire',
    alert_icon_bg: 'rgba(15, 23, 42, 0.8)',
    alert_icon_color: '#38bdf8',
    alert_icon_border: '#06b6d4',
    alert_name_color: '#f8fafc',
    alert_action_text: 'ส่งพลังโดเนท!',
    alert_action_color: '#38bdf8',
    alert_title_size: 26,
    alert_amount_bg: 'rgba(30, 27, 75, 0.7)',
    alert_amount_color: '#38bdf8',
    alert_amount_border: '#06b6d4',
    alert_amount_size: 24,
    alert_msg_bg: 'rgba(15, 23, 42, 0.5)',
    alert_msg_color: '#e2e8f0',
    alert_msg_border: '#334155',
    alert_msg_size: 18,
    alert_animation: 'slide-down',
    alert_glow: 'true',
    alert_shadow_show: 'true'
  },
  emerald_cash: {
    alert_theme: 'emerald_cash',
    alert_font: 'LINESeedSansTH',
    alert_card_bg: '#f0fdf4',
    alert_card_blur: 0,
    alert_card_width: 580,
    alert_border_color: '#86efac',
    alert_border_width: 1.5,
    alert_border_radius: 24,
    alert_shimmer_color: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)',
    alert_shimmer_show: 'true',
    alert_icon: 'coin',
    alert_icon_bg: '#dcfce7',
    alert_icon_color: '#059669',
    alert_icon_border: '#86efac',
    alert_name_color: '#065f46',
    alert_action_text: 'โดเนทให้',
    alert_action_color: '#059669',
    alert_title_size: 26,
    alert_amount_bg: '#dcfce7',
    alert_amount_color: '#065f46',
    alert_amount_border: '#86efac',
    alert_amount_size: 22,
    alert_msg_bg: '#ffffff',
    alert_msg_color: '#064e3b',
    alert_msg_border: '#bbf7d0',
    alert_msg_size: 18,
    alert_animation: 'slide-down',
    alert_glow: 'false',
    alert_shadow_show: 'true'
  }
};

export default function CustomizerPage() {
  const [settings, setSettings] = useState<AlertSettings>({
    alert_font: 'LINESeedSansTH',
    alert_card_bg: '#ffffff',
    alert_card_blur: 0,
    alert_card_width: 580,
    alert_border_color: '#e2e8f0',
    alert_border_width: 1.5,
    alert_border_radius: 24,
    alert_shadow_show: 'true',
    alert_glow: 'false',
    alert_shimmer_show: 'true',
    alert_card_beam: 'true',
    alert_card_beam_color: 'auto',
    alert_confetti_enabled: 'true',
    alert_particle_style: 'confetti',
    alert_shine_sweep: 'true',
    alert_shine_theme: 'crystal',
    alert_icon: 'gift',
    alert_icon_bg: '#f8fafc',
    alert_icon_color: '#0f172a',
    alert_icon_border: '#e2e8f0',
    alert_name_color: '#0f172a',
    alert_action_color: '#64748b',
    alert_action_text: 'โดเนทให้',
    alert_title_size: 26,
    alert_amount_bg: '#ecfdf5',
    alert_amount_color: '#059669',
    alert_amount_border: '#a7f3d0',
    alert_amount_size: 22,
    alert_msg_bg: '#f8fafc',
    alert_msg_color: '#334155',
    alert_msg_border: '#e2e8f0',
    alert_msg_size: 18,
    alert_letter_spacing: 0,
    alert_word_gap: 8,
    alert_text_margin_top: 0,
    alert_text_margin_bottom: 0,
    alert_text_margin_left: 0,
    alert_text_margin_right: 0,
    alert_icon_margin_bottom: 8,
    alert_msg_margin_top: 8,
    alert_line_height: 1.35,
    alert_text_stroke_enabled: 'false',
    alert_text_stroke_color: '#000000',
    alert_text_stroke_width: 1.5,
    alert_text_gradient_enabled: 'false',
    alert_text_gradient_preset: 'sunset',
    alert_text_gradient_from: '#ff512f',
    alert_text_gradient_to: '#dd2476',
    alert_text_gradient_angle: 135,
    alert_tiered_enabled: 'true',
    alert_tiered_rare_min: 50,
    alert_tiered_epic_min: 200,
    alert_tiered_legendary_min: 500,
    alert_tiered_common_color: '#22c55e',
    alert_tiered_common_from: '#22c55e',
    alert_tiered_common_to: '#10b981',
    alert_tiered_rare_color: '#00c6ff',
    alert_tiered_rare_from: '#00c6ff',
    alert_tiered_rare_to: '#0072ff',
    alert_tiered_epic_color: '#a855f7',
    alert_tiered_epic_from: '#da22ff',
    alert_tiered_epic_to: '#9733ee',
    alert_tiered_legendary_color: '#f59e0b',
    alert_tiered_legendary_from: '#f12711',
    alert_tiered_legendary_to: '#f5af19',
    alert_animation: 'slide-down',
    alert_duration: 8,
    alert_sound_url: '/sounds/alert.mp3'
  });

  const [activeCategoryTab, setActiveCategoryTab] = useState<'design' | 'typography' | 'tiered' | 'media'>('design');
  const [activePreset, setActivePreset] = useState<string>('modern_light');
  const [activeMode, setActiveMode] = useState<'frameless' | 'card'>('card');
  const [cardOpacity, setCardOpacity] = useState<number>(100);
  const [previewBg, setPreviewBg] = useState<'overlay' | 'checker' | 'game' | 'bright'>('overlay');
  const [mobileView, setMobileView] = useState<'controls' | 'preview'>('controls');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [obsUrl, setObsUrl] = useState<string>('http://localhost:3000/overlay');
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName?: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_theme') as 'light' | 'dark' | null;
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = prefersDark ? 'dark' : 'light';
        setTheme(initial);
        document.documentElement.setAttribute('data-theme', initial);
      }
    } catch (e) { }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('admin_theme', next);
      } catch (e) { }
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  // Sound Testing & Upload State
  const [isPlayingAlertSound, setIsPlayingAlertSound] = useState<boolean>(false);
  const [uploadingSound, setUploadingSound] = useState<boolean>(false);
  const [soundMode, setSoundMode] = useState<'preset' | 'custom'>('preset');
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);

  const handleTestAlertSound = () => {
    if (alertSoundRef.current) {
      alertSoundRef.current.pause();
      alertSoundRef.current = null;
    }

    const soundUrl = (settings.alert_sound_url || '/sounds/alert.mp3').trim();
    const vol = Math.min(Math.max((Number(settings.alert_volume ?? 80)) / 100, 0), 1);

    try {
      setIsPlayingAlertSound(true);
      const audio = new Audio(soundUrl);
      audio.volume = vol;
      alertSoundRef.current = audio;

      audio.onended = () => {
        setIsPlayingAlertSound(false);
      };
      audio.onerror = () => {
        setIsPlayingAlertSound(false);
        showToast('ไม่สามารถเล่นไฟล์เสียงกระดิ่งนี้ได้ ตรวจสอบ URL หรือไฟล์');
      };

      audio.play().catch(() => {
        setIsPlayingAlertSound(false);
      });
    } catch (e) {
      setIsPlayingAlertSound(false);
    }
  };

  const handleSoundUpload = async (file: File) => {
    setUploadingSound(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('donate_admin_token') || '') : '';
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['x-admin-token'] = adminToken;
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const res = await fetch('/api/admin/upload-media', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'อัปโหลดเสียงไม่สำเร็จ');
      }

      updateField('alert_sound_url', data.url);
      setSoundMode('custom');
      showToast('อัปโหลดไฟล์เสียงสำเร็จ!');
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์เสียง');
    } finally {
      setUploadingSound(false);
    }
  };

  // Test Alert Customization State
  const [testName, setTestName] = useState<string>('สมชาย ใจดี');
  const [testAmount, setTestAmount] = useState<number | string>(50);
  const [testMessage, setTestMessage] = useState<string>('สวัสดีครับ เป็นกำลังใจให้นะครับ สตรีมสนุกมาก!');
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleTestTtsVoice = async () => {
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }

    const vol = Math.min(Math.max((Number(settings.alert_volume ?? 80)) / 100, 0), 1);
    const donorName = (testName || 'สมชาย ใจดี').trim();
    const actionText = (settings.alert_action_text || 'โดเนทให้').trim();
    const thaiAmount = amountToThaiWords(testAmount || 50);
    const msg = (testMessage || '').trim();
    let sampleText = `${donorName} ${actionText} ${thaiAmount}`;
    if (msg) sampleText += ` ${msg}`;

    try {
      setIsPlayingTts(true);
      const url = `/api/tts?text=${encodeURIComponent(sampleText)}`;
      const audio = new Audio(url);
      audio.volume = vol;
      testAudioRef.current = audio;

      audio.onended = () => {
        setIsPlayingTts(false);
      };
      audio.onerror = () => {
        setIsPlayingTts(false);
        showToast('ไม่สามารถเล่นเสียงตัวอย่างได้');
      };

      await audio.play();
    } catch (err: any) {
      setIsPlayingTts(false);
      showToast('เกิดข้อผิดพลาดในการเล่นเสียง');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { }
    localStorage.removeItem('donate_admin_token');
    window.location.href = '/login';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setObsUrl(`${window.location.origin}/overlay`);
    }

    // Check logged in user session
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => { });

    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.settings) {
          setSettings(prev => ({ ...prev, ...res.settings }));
          if (res.settings.alert_theme) {
            setActivePreset(res.settings.alert_theme);
            if (res.settings.alert_theme === 'frameless_clear') setActiveMode('frameless');
          }
          if (res.settings.alert_sound_url) {
            const isPreset = ALERT_SOUND_PRESETS.some(p => p.id !== 'custom' && p.id === res.settings.alert_sound_url);
            setSoundMode(isPreset ? 'preset' : 'custom');
          }
        }
      })
      .catch(err => console.warn('Could not load settings:', err));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const updateField = (key: keyof AlertSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const p = PRESETS[presetKey];
    if (p) {
      setSettings(prev => ({ ...prev, ...p }));
      if (presetKey === 'frameless_clear') {
        setActiveMode('frameless');
        setCardOpacity(0);
      } else {
        setActiveMode('card');
        setCardOpacity(100);
      }
    }
  };

  const handleModeToggle = (mode: 'frameless' | 'card') => {
    setActiveMode(mode);
    if (mode === 'frameless') {
      applyPreset('frameless_clear');
    } else {
      applyPreset('modern_light');
    }
  };

  const handleOpacityPreset = (opacity: number, blur: number) => {
    setCardOpacity(opacity);
    updateField('alert_card_blur', blur);

    if (opacity === 0) {
      updateField('alert_card_bg', 'transparent');
    } else if (opacity === 100) {
      updateField('alert_card_bg', '#ffffff');
    } else {
      const alpha = (opacity / 100).toFixed(2);
      updateField('alert_card_bg', `rgba(255, 255, 255, ${alpha})`);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const adminToken = localStorage.getItem('donate_admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) headers['x-admin-token'] = adminToken;

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...settings, alert_theme: activePreset })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'บันทึกไม่สำเร็จ');
      }
      showToast('บันทึกและซิงค์การตั้งค่าขึ้นจอ OBS สำเร็จ');
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestRealObs = async () => {
    try {
      const adminToken = localStorage.getItem('donate_admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) headers['x-admin-token'] = adminToken;

      const parsedAmount = parseFloat(String(testAmount));
      const res = await fetch('/api/admin/test-alert', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: (testName || '').trim() || 'Anonymous',
          amount: !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 50,
          message: (testMessage || '').trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('ส่ง Test Alert ไปยัง OBS Studio เรียบร้อยแล้ว');
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการส่ง Test Alert');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleTriggerAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const handleResetDefault = () => {
    if (confirm('ต้องการคืนค่าเริ่มต้นทั้งหมดใช่หรือไม่?')) {
      applyPreset('modern_light');
      showToast('คืนค่าสไตล์เริ่มต้นแล้ว อย่าลืมกดบันทึกนะคะ');
    }
  };

  const handleCopyObsUrl = () => {
    navigator.clipboard.writeText(obsUrl);
    showToast('คัดลอก URL เรียบร้อยแล้ว!');
  };

  const handleCopyTikTokUrl = () => {
    const tiktokUrl = `${obsUrl}?tiktok=1`;
    navigator.clipboard.writeText(tiktokUrl);
    showToast('คัดลอกลิงก์ TikTok Live (ไร้พื้นหลัง) แล้ว!');
  };

  const isCardFrameless = activeMode === 'frameless' || settings.alert_card_bg === 'transparent';
  const IconComponent = ICONS[settings.alert_icon || 'gift'] || ICONS.gift;
  const isStrokeEnabled = settings.alert_text_stroke_enabled === 'true' || settings.alert_text_stroke_enabled === true;
  const strokeStyle: React.CSSProperties = isStrokeEnabled ? {
    WebkitTextStroke: `${settings.alert_text_stroke_width || 1.5}px ${settings.alert_text_stroke_color || '#000000'}`,
    paintOrder: 'stroke fill'
  } : {};

  return (
    <div className="admin-layout customizer-page-root">
      {/* Reusable Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="tabCustomizer"
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Reusable Mobile Top Bar */}
        <MobileTopBar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          title="OBS Alert Customizer"
          subtitle="สตูดิโอปรับแต่ง UI สตรีม"
          theme={theme}
          onToggleTheme={toggleTheme}
          rightAction={
            <Link
              href="/overlay"
              target="_blank"
              className="btn sm"
              style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
            >
              เปิด Overlay ↗
            </Link>
          }
        />

        {/* Customizer Workspace Action Header */}
        <div className="customizer-header">
          <div className="customizer-header-left">
            <h1 className="customizer-page-title">
              ปรับแต่ง Alert Overlay
            </h1>
            <p className="customizer-page-desc">
              ปรับแต่งสไตล์การแจ้งเตือนโดเนทสำหรับ OBS Studio
            </p>
          </div>

          <div className="customizer-header-actions">
            <button
              type="button"
              className="btn secondary sm"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
            </button>
            <button
              type="button"
              className="btn secondary sm"
              onClick={handleResetDefault}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>รีเซ็ต</span>
            </button>
            <button
              type="button"
              className="btn secondary sm"
              onClick={handleTestRealObs}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} />
              <span>ทดสอบส่งเข้า OBS</span>
            </button>
            <button
              type="button"
              className="btn sm"
              onClick={handleSave}
              disabled={isSaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="mobile-view-tabs">
          <button
            type="button"
            className={`mobile-view-btn ${mobileView === 'controls' ? 'active' : ''}`}
            onClick={() => setMobileView('controls')}
          >
            <Sliders size={15} />
            <span>แผงปรับแต่ง</span>
          </button>
          <button
            type="button"
            className={`mobile-view-btn ${mobileView === 'preview' ? 'active' : ''}`}
            onClick={() => setMobileView('preview')}
          >
            <Eye size={15} />
            <span>ดูพรีวิวบนจอ OBS</span>
          </button>
        </div>

        {/* Floating View Toggle Button on Mobile */}
        <button
          type="button"
          className="floating-view-toggle"
          onClick={() => setMobileView(mobileView === 'controls' ? 'preview' : 'controls')}
        >
          {mobileView === 'controls' ? <Eye size={16} /> : <Sliders size={16} />}
          <span>{mobileView === 'controls' ? 'ดูพรีวิวสด' : 'แก้ไขดีไซน์'}</span>
        </button>

        {/* Main Customizer Workspace */}
        <div className="customizer-container" data-mobile-view={mobileView}>
          {/* Left Column: Controls */}
          <div className="controls-panel">

            {/* Category Tabs Navigator */}
            <div className="customizer-tabs-nav">
              <button
                type="button"
                className={`customizer-tab-btn ${activeCategoryTab === 'design' ? 'active' : ''}`}
                onClick={() => setActiveCategoryTab('design')}
              >
                <span className="tab-icon"><Palette size={18} strokeWidth={2.2} /></span>
                <span className="tab-label">รูปแบบการ์ด</span>
              </button>
              <button
                type="button"
                className={`customizer-tab-btn ${activeCategoryTab === 'typography' ? 'active' : ''}`}
                onClick={() => setActiveCategoryTab('typography')}
              >
                <span className="tab-icon"><Type size={18} strokeWidth={2.2} /></span>
                <span className="tab-label">ข้อความ &amp; ไล่สี</span>
              </button>
              <button
                type="button"
                className={`customizer-tab-btn ${activeCategoryTab === 'tiered' ? 'active' : ''}`}
                onClick={() => setActiveCategoryTab('tiered')}
              >
                <span className="tab-icon"><Coins size={18} strokeWidth={2.2} /></span>
                <span className="tab-label">ระดับยอดเงิน</span>
              </button>
              <button
                type="button"
                className={`customizer-tab-btn ${activeCategoryTab === 'media' ? 'active' : ''}`}
                onClick={() => setActiveCategoryTab('media')}
              >
                <span className="tab-icon"><Volume2 size={18} strokeWidth={2.2} /></span>
                <span className="tab-label">เสียง &amp; อนิเมชัน</span>
              </button>
            </div>

            {/* TAB 1: DESIGN & CARD LAYOUT */}
            {activeCategoryTab === 'design' && (
              <>
                {/* Section: Card Shape & Structure */}
                <div className="panel-section">
                  <div className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    การ์ดและโครงสร้าง (Card Layout)
                  </div>

                  {/* Mode Segmented Toggle: Card vs Frameless */}
                  <div className="segmented-control" style={{ marginBottom: '16px' }}>
                    <button
                      type="button"
                      className={`segmented-btn ${activeMode === 'card' ? 'active' : ''}`}
                      onClick={() => handleModeToggle('card')}
                    >
                      <LayoutTemplate size={15} />
                      <span>แบบมีการ์ด (Card Mode)</span>
                    </button>
                    <button
                      type="button"
                      className={`segmented-btn ${activeMode === 'frameless' ? 'active' : ''}`}
                      onClick={() => handleModeToggle('frameless')}
                    >
                      <SquareDashed size={15} />
                      <span>แบบไร้กรอบโปร่งใส (TikTok Live / No BG)</span>
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span>ความกว้างการ์ด ({settings.alert_card_width || 580}px)</span>
                      </label>
                      <input
                        type="range"
                        min="400"
                        max="750"
                        step="10"
                        value={settings.alert_card_width || 580}
                        onChange={(e) => updateField('alert_card_width', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <span>ความมนขอบ ({settings.alert_border_radius ?? 24}px)</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="2"
                        value={settings.alert_border_radius ?? 24}
                        onChange={(e) => updateField('alert_border_radius', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span>ความหนาเส้นขอบ ({settings.alert_border_width ?? 1.5}px)</span>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => updateField('alert_border_width', 0)}
                        >
                          ปิดเส้นขอบ
                        </button>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="0.5"
                        value={settings.alert_border_width ?? 1.5}
                        onChange={(e) => updateField('alert_border_width', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">เงาการ์ดและแสงเรือง (Shadow &amp; Glow)</label>
                      <select
                        className="input-control"
                        value={
                          settings.alert_shadow_show === 'false'
                            ? 'none'
                            : settings.alert_glow === 'true'
                              ? 'true'
                              : 'false'
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === 'none') {
                            updateField('alert_shadow_show', 'false');
                            updateField('alert_glow', 'false');
                          } else if (v === 'true') {
                            updateField('alert_shadow_show', 'true');
                            updateField('alert_glow', 'true');
                          } else {
                            updateField('alert_shadow_show', 'true');
                            updateField('alert_glow', 'false');
                          }
                        }}
                      >
                        <option value="false">เงามาตรฐาน (Soft Shadow)</option>
                        <option value="true">แสงเรืองนีออน (Neon Glow)</option>
                        <option value="none">ไม่มีเงา (None)</option>
                      </select>
                    </div>
                  </div>

                  <div className="color-picker-grid">
                    <div className="color-field">
                      <div className="field-label-row">
                        <label>สีพื้นหลังการ์ด</label>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => {
                            updateField('alert_card_bg', 'transparent');
                            setCardOpacity(0);
                          }}
                        >
                          โปร่งใส
                        </button>
                      </div>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_card_bg?.startsWith('#') ? settings.alert_card_bg : '#ffffff'}
                          onChange={(e) => updateField('alert_card_bg', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_card_bg || '#ffffff'}
                          onChange={(e) => updateField('alert_card_bg', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-field">
                      <div className="field-label-row">
                        <label>สีเส้นขอบการ์ด</label>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => updateField('alert_border_color', 'transparent')}
                        >
                          โปร่งใส
                        </button>
                      </div>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_border_color?.startsWith('#') ? settings.alert_border_color : '#e2e8f0'}
                          onChange={(e) => updateField('alert_border_color', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_border_color || '#e2e8f0'}
                          onChange={(e) => updateField('alert_border_color', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Background Transparency & Blur Controls */}
                  <div className="transparency-control-box">
                    <div className="form-row" style={{ marginBottom: '8px' }}>
                      <div className="form-group">
                        <label className="form-label">
                          <span>ความโปร่งใสพื้นหลัง ({cardOpacity}%)</span>
                          <span className="label-hint">{cardOpacity === 100 ? 'ทึบแสง' : cardOpacity === 0 ? 'โปร่งใส 100%' : 'กึ่งโปร่ง'}</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={cardOpacity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCardOpacity(val);
                            if (val === 0) {
                              updateField('alert_card_bg', 'transparent');
                            } else if (val === 100) {
                              updateField('alert_card_bg', '#ffffff');
                            } else {
                              updateField('alert_card_bg', `rgba(255, 255, 255, ${(val / 100).toFixed(2)})`);
                            }
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <span>กระจกฝ้าฉากหลัง ({settings.alert_card_blur || 0}px)</span>
                          <span className="label-hint">ความเบลอ OBS</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="1"
                          value={settings.alert_card_blur || 0}
                          onChange={(e) => updateField('alert_card_blur', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Quick Opacity Presets */}
                    <div className="quick-opacity-row">
                      <div className="quick-op-title">ความโปร่งใสด่วน:</div>
                      <div className="quick-op-group">
                        <button
                          type="button"
                          className={`btn-quick-op ${cardOpacity === 0 ? 'active' : ''}`}
                          onClick={() => handleOpacityPreset(0, 0)}
                        >
                          <span>โปร่งใส 100%</span>
                        </button>
                        <button
                          type="button"
                          className={`btn-quick-op ${cardOpacity === 40 ? 'active' : ''}`}
                          onClick={() => handleOpacityPreset(40, 12)}
                        >
                          <span>กึ่งโปร่ง 40%</span>
                        </button>
                        <button
                          type="button"
                          className={`btn-quick-op ${cardOpacity === 75 ? 'active' : ''}`}
                          onClick={() => handleOpacityPreset(75, 16)}
                        >
                          <span>กระจกฝ้า 75%</span>
                        </button>
                        <button
                          type="button"
                          className={`btn-quick-op ${cardOpacity === 100 ? 'active' : ''}`}
                          onClick={() => handleOpacityPreset(100, 0)}
                        >
                          <span>ทึบแสง 100%</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Icon & Header */}
                <div className="panel-section">
                  <div className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 12 20 22 4 22 4 12"></polyline>
                      <rect x="2" y="7" width="20" height="5"></rect>
                      <line x1="12" y1="22" x2="12" y2="7"></line>
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                    </svg>
                    ไอคอน & แถบสีด้านบน (Accent & Icon)
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">เลือกรูปไอคอน</label>
                      <select
                        className="input-control"
                        value={settings.alert_icon || 'gift'}
                        onChange={(e) => updateField('alert_icon', e.target.value)}
                      >
                        <option value="gift">กล่องของขวัญ (Gift Box)</option>
                        <option value="heart">หัวใจ (Heart)</option>
                        <option value="coin">เหรียญ (Coin)</option>
                        <option value="star">ดาว (Star)</option>
                        <option value="fire">เปลวไฟ (Fire)</option>
                        <option value="trophy">ถ้วยรางวัล (Trophy)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <div className="field-label-row">
                        <label className="form-label" style={{ marginBottom: 0 }}>ข้อความบอกการกระทำ (Action Text)</label>
                        <span className="label-hint">เช่น โดเนทให้, สนับสนุน</span>
                      </div>
                      <input
                        type="text"
                        className="input-control"
                        value={settings.alert_action_text || 'โดเนทให้'}
                        onChange={(e) => updateField('alert_action_text', e.target.value)}
                        placeholder="เช่น โดเนทให้ / สนับสนุน / เลี้ยงกาแฟ"
                      />
                      <div className="action-text-chips" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {['โดเนทให้', 'สนับสนุน', 'เลี้ยงกาแฟ', 'ส่งกำลังใจ', 'เปย์ให้'].map((txt) => (
                          <button
                            key={txt}
                            type="button"
                            className="btn-action-chip"
                            onClick={() => updateField('alert_action_text', txt)}
                          >
                            {txt}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                        รูปแบบบนจอ: <strong style={{ color: 'var(--text-main)' }}>[ชื่อ] [ข้อความ] [จำนวน] บาท</strong>
                      </div>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginBottom: '12px' }}>
                    <div className="form-group" style={{ width: '100%' }}>
                      <label className="form-label">ลำแสงวิ่งบนตัวอักษร (Shimmer Sweep)</label>
                      <select
                        className="input-control"
                        value={String(settings.alert_shine_sweep !== 'false')}
                        onChange={(e) => updateField('alert_shine_sweep', e.target.value)}
                      >
                        <option value="true">เปิดเอฟเฟกต์แสงวิ่งผ่านตัวอักษร</option>
                        <option value="false">ปิดเอฟเฟกต์แสงวิ่ง</option>
                      </select>
                    </div>
                  </div>

                  {settings.alert_shine_sweep !== 'false' && (
                    <div className="form-row" style={{ marginBottom: '12px' }}>
                      <div className="form-group" style={{ width: '100%' }}>
                        <label className="form-label">โทนสีประกายแสงวิ่งตัวอักษร</label>
                        <select
                          className="input-control"
                          value={settings.alert_shine_theme || 'crystal'}
                          onChange={(e) => updateField('alert_shine_theme', e.target.value)}
                        >
                          <option value="crystal">คริสตัล (Crystal Diamond)</option>
                          <option value="gold">ประกายทอง (Golden Glow)</option>
                          <option value="cyan">นีออนไซแอน (Cyber Cyan)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="form-row" style={{ marginBottom: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">แถบสีด้านบน (Shimmer Bar)</label>
                      <select
                        className="input-control"
                        value={String(settings.alert_shimmer_show !== 'false')}
                        onChange={(e) => updateField('alert_shimmer_show', e.target.value)}
                      >
                        <option value="true">แสดงแถบสีด้านบน</option>
                        <option value="false">ซ่อนแถบสีด้านบน</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <span>กล่องพื้นหลังไอคอน</span>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => {
                            updateField('alert_icon_bg', 'transparent');
                            updateField('alert_icon_border', 'transparent');
                          }}
                        >
                          โปร่งใส
                        </button>
                      </label>
                      <select
                        className="input-control"
                        value={settings.alert_icon_bg === 'transparent' ? 'none' : 'box'}
                        onChange={(e) => {
                          if (e.target.value === 'none') {
                            updateField('alert_icon_bg', 'transparent');
                            updateField('alert_icon_border', 'transparent');
                          } else {
                            updateField('alert_icon_bg', '#f8fafc');
                            updateField('alert_icon_border', '#e2e8f0');
                          }
                        }}
                      >
                        <option value="box">มีกล่องพื้นหลังไอคอน</option>
                        <option value="none">โปร่งใส (ลอยเฉพาะไอคอน)</option>
                      </select>
                    </div>
                  </div>

                  <div className="color-picker-grid">
                    <div className="color-field">
                      <label>สีไอคอน</label>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_icon_color?.startsWith('#') ? settings.alert_icon_color : '#0f172a'}
                          onChange={(e) => updateField('alert_icon_color', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_icon_color || '#0f172a'}
                          onChange={(e) => updateField('alert_icon_color', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-field">
                      <div className="field-label-row">
                        <label>สีพื้นหลังกล่องไอคอน</label>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => updateField('alert_icon_bg', 'transparent')}
                        >
                          โปร่งใส
                        </button>
                      </div>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_icon_bg?.startsWith('#') ? settings.alert_icon_bg : '#f8fafc'}
                          onChange={(e) => updateField('alert_icon_bg', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_icon_bg || '#f8fafc'}
                          onChange={(e) => updateField('alert_icon_bg', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-field full-width">
                      <label>แถบสีสตรีคด้านบน (Shimmer Bar Gradient / Color)</label>
                      <input
                        type="text"
                        className="input-control"
                        value={settings.alert_shimmer_color || 'linear-gradient(90deg, #0f172a 0%, #2563eb 50%, #059669 100%)'}
                        onChange={(e) => updateField('alert_shimmer_color', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: TYPOGRAPHY, COLORS & GRADIENT */}
            {activeCategoryTab === 'typography' && (
              <>
                {/* Section: Typography & Colors */}
                <div className="panel-section">
                  <div className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 7 4 4 20 4 20 7"></polyline>
                      <line x1="9" y1="20" x2="15" y2="20"></line>
                      <line x1="12" y1="4" x2="12" y2="20"></line>
                    </svg>
                    ฟอนต์ & สีตัวอักษร (Typography)
                  </div>

                  <div className="form-group">
                    <label className="form-label">ฟอนต์ตัวอักษร (Font Family)</label>
                    <select
                      className="input-control"
                      value={settings.alert_font || 'LINESeedSansTH'}
                      onChange={(e) => updateField('alert_font', e.target.value)}
                    >
                      <option value="LINESeedSansTH">LINE Seed Sans TH (Regular ปกติ)</option>
                      <option value="LINESeedSansTH-ExtraBold">LINE Seed Sans TH (ExtraBold หนาพิเศษ)</option>
                    </select>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
                      * ฟอนต์และสีที่ตั้งค่าจะแสดงผลเฉพาะการ์ดแจ้งเตือน (Donate Alert UI) เท่านั้น เว็บแอปส่วนอื่นจะใช้ฟอนต์ Regular ปกติ
                    </span>
                  </div>

                  <div className="color-picker-grid">
                    <div className="color-field">
                      <label>สีชื่อผู้สนับสนุน</label>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_name_color?.startsWith('#') ? settings.alert_name_color : '#0f172a'}
                          onChange={(e) => updateField('alert_name_color', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_name_color || '#0f172a'}
                          onChange={(e) => updateField('alert_name_color', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-field">
                      <label>สีข้อความต่อท้ายชื่อ</label>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_action_color?.startsWith('#') ? settings.alert_action_color : '#64748b'}
                          onChange={(e) => updateField('alert_action_color', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_action_color || '#64748b'}
                          onChange={(e) => updateField('alert_action_color', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '14px' }}>
                    <label className="form-label">
                      <span>ขนาดตัวอักษรชื่อ (Title Size)</span>
                      <span className="label-val">{settings.alert_title_size || 26}px</span>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="36"
                      value={settings.alert_title_size || 26}
                      onChange={(e) => updateField('alert_title_size', parseInt(e.target.value))}
                    />
                  </div>

                  {/* Stroke Text (เส้นขอบตัวอักษร) */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: 0 }}>
                        เส้นขอบตัวอักษร (Stroke Text)
                      </label>
                      {settings.alert_text_stroke_enabled === 'true' && (
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => updateField('alert_text_stroke_enabled', 'false')}
                        >
                          ปิด
                        </button>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">เปิดใช้งานเส้นขอบตัวอักษร</label>
                      <div className="segmented-control">
                        <button
                          type="button"
                          className={`segmented-btn ${settings.alert_text_stroke_enabled !== 'true' ? 'active' : ''}`}
                          onClick={() => updateField('alert_text_stroke_enabled', 'false')}
                        >
                          ปิดเส้นขอบ
                        </button>
                        <button
                          type="button"
                          className={`segmented-btn ${settings.alert_text_stroke_enabled === 'true' ? 'active' : ''}`}
                          onClick={() => {
                            updateField('alert_text_stroke_enabled', 'true');
                            if (!settings.alert_text_stroke_color) updateField('alert_text_stroke_color', '#000000');
                            if (!settings.alert_text_stroke_width) updateField('alert_text_stroke_width', 1.5);
                          }}
                        >
                          เปิดเส้นขอบ
                        </button>
                      </div>
                    </div>

                    {settings.alert_text_stroke_enabled === 'true' && (
                      <div className="customizer-subbox" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div className="color-field">
                          <div className="field-label-row">
                            <label>กำหนดสีเส้นขอบ (Stroke Color)</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-text-action"
                                style={{ borderColor: "var(--border)", background: '#000000', color: "var(--text-main)" }}
                                onClick={() => updateField('alert_text_stroke_color', '#000000')}
                              >
                                ดำ
                              </button>
                              <button
                                type="button"
                                className="btn-text-action"
                                style={{ borderColor: "var(--border)", background: "var(--bg-panel)", color: '#000000' }}
                                onClick={() => updateField('alert_text_stroke_color', '#ffffff')}
                              >
                                ขาว
                              </button>
                              <button
                                type="button"
                                className="btn-text-action"
                                style={{ borderColor: "var(--border)", background: '#2563eb', color: "var(--text-main)" }}
                                onClick={() => updateField('alert_text_stroke_color', '#1e3a8a')}
                              >
                                น้ำเงิน
                              </button>
                              <button
                                type="button"
                                className="btn-text-action"
                                style={{ borderColor: "var(--border)", background: '#dc2626', color: "var(--text-main)" }}
                                onClick={() => updateField('alert_text_stroke_color', '#991b1b')}
                              >
                                แดง
                              </button>
                            </div>
                          </div>
                          <div className="color-input-wrap">
                            <input
                              type="color"
                              value={settings.alert_text_stroke_color?.startsWith('#') ? settings.alert_text_stroke_color : '#000000'}
                              onChange={(e) => updateField('alert_text_stroke_color', e.target.value)}
                            />
                            <input
                              type="text"
                              className="hex-input"
                              value={settings.alert_text_stroke_color || '#000000'}
                              onChange={(e) => updateField('alert_text_stroke_color', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <span>ความหนาเส้นขอบ (Stroke Width)</span>
                            <span className="label-val">{settings.alert_text_stroke_width || 1.5}px</span>
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="4"
                            step="0.5"
                            value={settings.alert_text_stroke_width || 1.5}
                            onChange={(e) => updateField('alert_text_stroke_width', parseFloat(e.target.value))}
                          />
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            ช่วยให้อ่านตัวอักษรได้ชัดเจน คมชัด บนทุกฉากหลังเกมและสตรีม
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Gradient (ไล่สีตัวอักษร) */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: 0 }}>
                        ไล่สีตัวอักษร (Text Gradient)
                      </label>
                      {settings.alert_text_gradient_enabled === 'true' && (
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => updateField('alert_text_gradient_enabled', 'false')}
                        >
                          ปิด
                        </button>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">เปิดใช้งานไล่สีตัวอักษร (ชื่อผู้โดเนท &amp; ยอดเงิน)</label>
                      <div className="segmented-control">
                        <button
                          type="button"
                          className={`segmented-btn ${settings.alert_text_gradient_enabled !== 'true' ? 'active' : ''}`}
                          onClick={() => updateField('alert_text_gradient_enabled', 'false')}
                        >
                          สีเดี่ยว (Solid)
                        </button>
                        <button
                          type="button"
                          className={`segmented-btn ${settings.alert_text_gradient_enabled === 'true' ? 'active' : ''}`}
                          onClick={() => {
                            updateField('alert_text_gradient_enabled', 'true');
                            if (!settings.alert_text_gradient_from) updateField('alert_text_gradient_from', '#ff512f');
                            if (!settings.alert_text_gradient_to) updateField('alert_text_gradient_to', '#dd2476');
                            if (!settings.alert_text_gradient_angle) updateField('alert_text_gradient_angle', 135);
                          }}
                        >
                          ไล่ระดับสี (Gradient)
                        </button>
                      </div>
                    </div>

                    {settings.alert_text_gradient_enabled === 'true' && (
                      <div className="customizer-subbox" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}>
                        {/* Live Preview Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: 'var(--text-muted)' }}>
                            <span>ตัวอย่างแถบไล่สี:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>
                              {settings.alert_text_gradient_from || '#ff512f'} ➔ {settings.alert_text_gradient_to || '#dd2476'} ({settings.alert_text_gradient_angle || 135}°)
                            </span>
                          </div>
                          <div style={{
                            height: '24px',
                            borderRadius: '8px',
                            border: "1px solid var(--border)",
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
                            background: `linear-gradient(${settings.alert_text_gradient_angle || 135}deg, ${settings.alert_text_gradient_from || '#ff512f'} 0%, ${settings.alert_text_gradient_to || '#dd2476'} 100%)`
                          }} />
                        </div>

                        {/* Presets Grid */}
                        <div>
                          <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '8px' }}>
                            ชุดสีสำเร็จรูปยอดนิยม (Color Presets)
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                            {TEXT_GRADIENT_PRESETS.map((p) => {
                              const isSelected = settings.alert_text_gradient_from === p.from && settings.alert_text_gradient_to === p.to;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  className={`gradient-preset-btn ${isSelected ? 'active' : ''}`}
                                  onClick={() => {
                                    updateField('alert_text_gradient_preset', p.id);
                                    updateField('alert_text_gradient_from', p.from);
                                    updateField('alert_text_gradient_to', p.to);
                                    updateField('alert_text_gradient_angle', p.angle);
                                  }}
                                >
                                  <span style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    border: "1px solid var(--border)",
                                    background: `linear-gradient(135deg, ${p.from}, ${p.to})`
                                  }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom 2-Color Pickers */}
                        <div className="color-picker-grid" style={{ marginBottom: 0 }}>
                          <div className="color-field">
                            <label>สีเริ่มต้น (From Color)</label>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_text_gradient_from?.startsWith('#') ? settings.alert_text_gradient_from : '#ff512f'}
                                onChange={(e) => {
                                  updateField('alert_text_gradient_preset', 'custom');
                                  updateField('alert_text_gradient_from', e.target.value);
                                }}
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_text_gradient_from || '#ff512f'}
                                onChange={(e) => {
                                  updateField('alert_text_gradient_preset', 'custom');
                                  updateField('alert_text_gradient_from', e.target.value);
                                }}
                              />
                            </div>
                          </div>

                          <div className="color-field">
                            <label>สีปลายทาง (To Color)</label>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_text_gradient_to?.startsWith('#') ? settings.alert_text_gradient_to : '#dd2476'}
                                onChange={(e) => {
                                  updateField('alert_text_gradient_preset', 'custom');
                                  updateField('alert_text_gradient_to', e.target.value);
                                }}
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_text_gradient_to || '#dd2476'}
                                onChange={(e) => {
                                  updateField('alert_text_gradient_preset', 'custom');
                                  updateField('alert_text_gradient_to', e.target.value);
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Gradient Angle Slider */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">
                            <span>องศาการไล่สี (Gradient Angle)</span>
                            <span className="label-val">{settings.alert_text_gradient_angle ?? 135}°</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="15"
                            value={settings.alert_text_gradient_angle ?? 135}
                            onChange={(e) => {
                              updateField('alert_text_gradient_preset', 'custom');
                              updateField('alert_text_gradient_angle', parseInt(e.target.value));
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                            <span>แนวนอน (90°)</span>
                            <span>แนวทแยง (135°)</span>
                            <span>แนวตั้ง (180°)</span>
                          </div>
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.45, background: "var(--accent-soft)", padding: '8px 10px', borderRadius: '8px', border: "1px solid var(--border)" }}>
                          <strong>รองรับเอฟเฟกต์แสง:</strong> หากเปิดใช้งาน <em>ลำแสงวิ่งบนตัวอักษร (Shine Sweep)</em> แสงจะวิ่งพาดผ่านสีไล่ระดับ Gradient ได้อย่างกลมกลืน
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Animation: Wave Pop & Count-up Punch */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: 0 }}>
                        เอฟเฟกต์ตัวอักษรเคลื่อนไหว (Wave Pop &amp; Count-up)
                      </label>
                      {(settings.alert_text_effect_enabled === 'false' || settings.alert_text_effect_enabled === false) ? (
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => {
                            updateField('alert_text_effect_enabled', 'true');
                            setIsAnimating(true);
                            setTimeout(() => setIsAnimating(false), 50);
                          }}
                        >
                          เปิด
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => updateField('alert_text_effect_enabled', 'false')}
                        >
                          ปิด
                        </button>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">แอนิเมชันเปิดตัวของตัวหนังสือ</label>
                      <div className="segmented-control">
                        <button
                          type="button"
                          className={`segmented-btn ${(settings.alert_text_effect_enabled !== 'false' && settings.alert_text_effect_enabled !== false) ? 'active' : ''}`}
                          onClick={() => {
                            updateField('alert_text_effect_enabled', 'true');
                            setIsAnimating(true);
                            setTimeout(() => setIsAnimating(false), 50);
                          }}
                        >
                          เปิดเอฟเฟกต์ (Wave &amp; Count-up)
                        </button>
                        <button
                          type="button"
                          className={`segmented-btn ${(settings.alert_text_effect_enabled === 'false' || settings.alert_text_effect_enabled === false) ? 'active' : ''}`}
                          onClick={() => updateField('alert_text_effect_enabled', 'false')}
                        >
                          ปิดเอฟเฟกต์ (แสดงแบบปกติ)
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, background: 'var(--accent-soft)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div>✨ <strong>ชื่อผู้โดเนท:</strong> เด้งเป็นคลื่นทีละตัวอักษร (Wave Pop) สะดุดตา</div>
                      <div style={{ marginTop: '4px' }}>🔢 <strong>ยอดเงิน:</strong> นับวิ่งจาก 0 ถึงยอดจริง (Count-up) พร้อมเอฟเฟกต์เด้ง Punch Pop ปิดท้าย</div>
                      <div style={{ marginTop: '4px' }}>💬 <strong>ข้อความโดเนท:</strong> ค่อยๆ ปรากฏเลื่อนขึ้นอย่างนุ่มนวล (Smooth Fade-in)</div>
                    </div>
                  </div>

                  {/* Spacing Controls (บน ล่าง ซ้าย ขวา & ช่องไฟ) */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: 0 }}>
                        ระยะห่างตัวอักษรและข้อความ (Text Spacing)
                      </label>
                      <button
                        type="button"
                        className="btn-text-action"
                        onClick={() => {
                          updateField('alert_icon_margin_bottom', 8);
                          updateField('alert_msg_margin_top', 8);
                          updateField('alert_text_margin_top', 0);
                          updateField('alert_text_margin_bottom', 0);
                          updateField('alert_text_margin_left', 0);
                          updateField('alert_text_margin_right', 0);
                          updateField('alert_letter_spacing', 0);
                          updateField('alert_word_gap', 8);
                        }}
                      >
                        รีเซ็ตระยะห่าง
                      </button>
                    </div>

                    {/* Vertical Gaps (ไอคอน ↔ ชื่อ ↔ ข้อความ) */}
                    <div style={{
                      background: "var(--accent-soft)",
                      border: "1.5px solid var(--border)",
                      borderRadius: 'var(--radius-md, 12px)',
                      padding: '14px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
                        ระยะห่างแนวตั้ง (ไอคอน ↔ ชื่อโดเนท ↔ ข้อความ)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            <span>ระยะห่างไอคอน ↔ ชื่อโดเนท</span>
                            <span className="label-val">{settings.alert_icon_margin_bottom ?? 8}px</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={settings.alert_icon_margin_bottom ?? 8}
                            onChange={(e) => updateField('alert_icon_margin_bottom', parseInt(e.target.value))}
                          />
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            ระยะห่างระหว่างไอคอนกับชื่อ
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <span>ระยะห่างชื่อโดเนท ↔ ข้อความ</span>
                            <span className="label-val">{settings.alert_msg_margin_top ?? 8}px</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={settings.alert_msg_margin_top ?? 8}
                            onChange={(e) => updateField('alert_msg_margin_top', parseInt(e.target.value))}
                          />
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            ระยะห่างระหว่างบรรทัดชื่อกับกล่องข้อความ
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4-way Spacing Grid (บน, ล่าง, ซ้าย, ขวา) */}
                    <div className="customizer-subbox" style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                        ปรับตำแหน่งกรอบตัวอักษรเพิ่มเติม (Fine-tune Margins)
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            <span>ระยะขอบบน (Top Margin)</span>
                            <span className="label-val">{settings.alert_text_margin_top ?? 0}px</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="60"
                            value={settings.alert_text_margin_top ?? 0}
                            onChange={(e) => updateField('alert_text_margin_top', parseInt(e.target.value))}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <span>ระยะขอบล่าง (Bottom Margin)</span>
                            <span className="label-val">{settings.alert_text_margin_bottom ?? 0}px</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="60"
                            value={settings.alert_text_margin_bottom ?? 0}
                            onChange={(e) => updateField('alert_text_margin_bottom', parseInt(e.target.value))}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <span>ระยะขอบซ้าย (Left Margin)</span>
                            <span className="label-val">{settings.alert_text_margin_left ?? 0}px</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="60"
                            value={settings.alert_text_margin_left ?? 0}
                            onChange={(e) => updateField('alert_text_margin_left', parseInt(e.target.value))}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            <span>ระยะขอบขวา (Right Margin)</span>
                            <span className="label-val">{settings.alert_text_margin_right ?? 0}px</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="60"
                            value={settings.alert_text_margin_right ?? 0}
                            onChange={(e) => updateField('alert_text_margin_right', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Letter Spacing & Word Gap */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">
                          <span>ช่องไฟตัวอักษร (Letter Spacing)</span>
                          <span className="label-val">{settings.alert_letter_spacing ?? 0}px</span>
                        </label>
                        <input
                          type="range"
                          min="-2"
                          max="16"
                          step="1"
                          value={settings.alert_letter_spacing ?? 0}
                          onChange={(e) => updateField('alert_letter_spacing', parseInt(e.target.value))}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          ระยะห่างแนวนอนระหว่างตัวอักษรแต่ละตัว
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <span>ระยะห่างระหว่างคำ (Word Gap)</span>
                          <span className="label-val">{settings.alert_word_gap ?? 8}px</span>
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="32"
                          step="1"
                          value={settings.alert_word_gap ?? 8}
                          onChange={(e) => updateField('alert_word_gap', parseInt(e.target.value))}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          ระยะห่างระหว่าง [ชื่อ] ↔ [ข้อความ] ↔ [ยอดเงิน]
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Amount & Message Styling */}
                <div className="panel-section">
                  <div className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    ป้ายยอดเงิน & กล่องข้อความ (Amount & Message)
                  </div>

                  <div className="form-row" style={{ marginBottom: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        <span>ป้ายพื้นหลังยอดเงิน</span>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => {
                            updateField('alert_amount_bg', 'transparent');
                            updateField('alert_amount_border', 'transparent');
                          }}
                        >
                          ลอยเฉพาะตัวเลข
                        </button>
                      </label>
                      <select
                        className="input-control"
                        value={settings.alert_amount_bg === 'transparent' ? 'none' : 'pill'}
                        onChange={(e) => {
                          if (e.target.value === 'none') {
                            updateField('alert_amount_bg', 'transparent');
                            updateField('alert_amount_border', 'transparent');
                          } else {
                            updateField('alert_amount_bg', '#ecfdf5');
                            updateField('alert_amount_border', '#a7f3d0');
                          }
                        }}
                      >
                        <option value="pill">มีป้ายพื้นหลังยอดเงิน (Pill Badge)</option>
                        <option value="none">ไม่มีพื้นหลัง (ลอยเฉพาะตัวเลข)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <span>พื้นหลังกล่องข้อความ</span>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => {
                            updateField('alert_msg_bg', 'transparent');
                            updateField('alert_msg_border', 'transparent');
                          }}
                        >
                          ลอยเฉพาะข้อความ
                        </button>
                      </label>
                      <select
                        className="input-control"
                        value={settings.alert_msg_bg === 'transparent' ? 'none' : 'box'}
                        onChange={(e) => {
                          if (e.target.value === 'none') {
                            updateField('alert_msg_bg', 'transparent');
                            updateField('alert_msg_border', 'transparent');
                          } else {
                            updateField('alert_msg_bg', '#f8fafc');
                            updateField('alert_msg_border', '#e2e8f0');
                          }
                        }}
                      >
                        <option value="box">มีกล่องพื้นหลังข้อความ</option>
                        <option value="none">ไม่มีพื้นหลัง (ลอยเฉพาะข้อความ)</option>
                      </select>
                    </div>
                  </div>

                  <div className="color-picker-grid">
                    <div className="color-field">
                      <div className="field-label-row">
                        <label>สีพื้นหลังป้ายยอดเงิน</label>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => updateField('alert_amount_bg', 'transparent')}
                        >
                          โปร่งใส
                        </button>
                      </div>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_amount_bg?.startsWith('#') ? settings.alert_amount_bg : '#ecfdf5'}
                          onChange={(e) => updateField('alert_amount_bg', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_amount_bg || '#ecfdf5'}
                          onChange={(e) => updateField('alert_amount_bg', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-field">
                      <label>สีตัวเลขยอดเงิน</label>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_amount_color?.startsWith('#') ? settings.alert_amount_color : '#059669'}
                          onChange={(e) => updateField('alert_amount_color', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_amount_color || '#059669'}
                          onChange={(e) => updateField('alert_amount_color', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-field">
                      <div className="field-label-row">
                        <label>สีพื้นหลังกล่องข้อความ</label>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={() => updateField('alert_msg_bg', 'transparent')}
                        >
                          โปร่งใส
                        </button>
                      </div>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_msg_bg?.startsWith('#') ? settings.alert_msg_bg : '#f8fafc'}
                          onChange={(e) => updateField('alert_msg_bg', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_msg_bg || '#f8fafc'}
                          onChange={(e) => updateField('alert_msg_bg', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="color-field">
                      <label>สีตัวหนังสือข้อความ</label>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={settings.alert_msg_color?.startsWith('#') ? settings.alert_msg_color : '#334155'}
                          onChange={(e) => updateField('alert_msg_color', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-input"
                          value={settings.alert_msg_color || '#334155'}
                          onChange={(e) => updateField('alert_msg_color', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="quick-msg-transparency" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ปรับพื้นหลังข้อความด่วน:</span>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }}
                      onClick={() => {
                        updateField('alert_msg_bg', 'rgba(255, 255, 255, 0.4)');
                        updateField('alert_msg_border', 'rgba(255, 255, 255, 0.6)');
                      }}
                    >
                      กระจกฝ้ากึ่งโปร่ง
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }}
                      onClick={() => {
                        updateField('alert_msg_bg', '#f8fafc');
                        updateField('alert_msg_border', '#e2e8f0');
                      }}
                    >
                      คืนค่าสีพื้นเดิม
                    </button>
                  </div>

                  <div className="form-row" style={{ marginTop: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">ขนาดยอดเงิน ({settings.alert_amount_size || 22}px)</label>
                      <input
                        type="range"
                        min="18"
                        max="32"
                        value={settings.alert_amount_size || 22}
                        onChange={(e) => updateField('alert_amount_size', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ขนาดข้อความ ({settings.alert_msg_size || 18}px)</label>
                      <input
                        type="range"
                        min="14"
                        max="24"
                        value={settings.alert_msg_size || 18}
                        onChange={(e) => updateField('alert_msg_size', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 4: ANIMATION & MEDIA SOUND */}
            {activeCategoryTab === 'media' && (
              <>
                {/* Section: Animation & Sound */}
                <div className="panel-section">
                  <div className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    อนิเมชั่นและเวลาแสดงผล (Animation & Timing)
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">รูปแบบอนิเมชั่นเข้า-ออก</label>
                      <select
                        className="input-control"
                        value={settings.alert_animation || 'slide-down'}
                        onChange={(e) => updateField('alert_animation', e.target.value)}
                      >
                        <option value="slide-down">Slide Down (เลื่อนลงมาจากด้านบน)</option>
                        <option value="bounce">Bounce Pop (เด้งดึ๋ง สดใส มีพลัง)</option>
                        <option value="zoom">Zoom Fade (ซูมขยาย คมชัด)</option>
                        <option value="slide-left">Slide Left (เลื่อนจากซ้ายไปขวา)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <span>ระยะเวลาแสดงผล ({settings.alert_duration || 8} วินาที)</span>
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="25"
                        value={settings.alert_duration || 8}
                        onChange={(e) => updateField('alert_duration', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Special Alert Effects (Neon Border Beam & Confetti Burst) */}
                <div className="panel-section">
                  <div className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    เอฟเฟกต์พิเศษ (Special Alert Effects)
                  </div>
                  <p className="section-desc">
                    เพิ่มความพรีเมียมให้การ์ดแจ้งเตือนด้วยลำแสงเลเซอร์ 360° และพลุละอองดาวเมื่อมีคนโดเนท
                  </p>

                  {/* 1. Neon Border Beam */}
                  <div className="customizer-subbox" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main, #0f172a)' }}>
                          ลำแสงนีออนวิ่งวนรอบขอบการ์ด (Neon Border Beam)
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                          เส้นแสงเลเซอร์เรืองแสงหมุนวนรอบกรอบ 360 องศา สไตล์ Modern Streamer
                        </div>
                      </div>
                      <div className="segmented-control">
                        <button
                          type="button"
                          className={`segmented-btn ${(settings.alert_card_beam === 'true' || settings.alert_card_beam === true) ? 'active' : ''}`}
                          onClick={() => updateField('alert_card_beam', 'true')}
                        >
                          เปิด
                        </button>
                        <button
                          type="button"
                          className={`segmented-btn ${(settings.alert_card_beam === 'false' || settings.alert_card_beam === false) ? 'active' : ''}`}
                          onClick={() => updateField('alert_card_beam', 'false')}
                        >
                          ปิด
                        </button>
                      </div>
                    </div>

                    {(settings.alert_card_beam === 'true' || settings.alert_card_beam === true) && (
                      <div className="form-row" style={{ marginTop: '12px', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">โหมดสีลำแสง (Beam Color Mode)</label>
                          <select
                            className="input-control"
                            value={settings.alert_card_beam_color && settings.alert_card_beam_color.startsWith('#') ? 'custom' : 'auto'}
                            onChange={(e) => {
                              if (e.target.value === 'auto') {
                                updateField('alert_card_beam_color', 'auto');
                              } else {
                                updateField('alert_card_beam_color', '#38bdf8');
                              }
                            }}
                          >
                            <option value="auto">อิงตามระดับยอดเงิน (Auto Tier: ฟ้า/ม่วง/ส้มทอง)</option>
                            <option value="custom">กำหนดสีเอง (Custom Color)</option>
                          </select>
                        </div>

                        {settings.alert_card_beam_color && settings.alert_card_beam_color.startsWith('#') && (
                          <div className="form-group">
                            <label className="form-label">เลือกสีลำแสง</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="color"
                                value={settings.alert_card_beam_color || '#38bdf8'}
                                onChange={(e) => updateField('alert_card_beam_color', e.target.value)}
                                style={{ width: '42px', height: '38px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)' }}
                              />
                              <input
                                type="text"
                                className="input-control"
                                value={settings.alert_card_beam_color || '#38bdf8'}
                                onChange={(e) => updateField('alert_card_beam_color', e.target.value)}
                                style={{ flex: 1 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Particle Styles Grid */}
                  <div className="customizer-subbox">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main, #0f172a)' }}>
                        สไตล์ละอองแสง &amp; พลุระเบิด (Particle Effect Style)
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                        เลือกสไตล์เอฟเฟกต์ละอองที่จะพุ่งกระจายรอบการ์ดเมื่อมีคนโดเนท
                      </div>
                    </div>

                    <div className="particle-style-grid">
                      {[
                        {
                          id: 'confetti',
                          title: 'Confetti พลุริบบิ้น',
                          desc: 'ริบบิ้นหลากสีสันสดใส มีพลัง',
                          icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5.8 11.3 2 22l10.7-3.79" />
                              <path d="M4 3h.01" />
                              <path d="M22 8h.01" />
                              <path d="M15 2h.01" />
                              <path d="M22 20h.01" />
                              <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38e-1a1.99 1.99 0 0 1-1.89-1.34l-.3-.9A2 2 0 0 0 12.18 4H12" />
                            </svg>
                          )
                        },
                        {
                          id: 'gold_sparkle',
                          title: 'Gold Sparkles',
                          desc: 'ละอองดาวทองคำระยิบระยับ',
                          icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          )
                        },
                        {
                          id: 'hearts',
                          title: 'Floating Hearts',
                          desc: 'หัวใจสีชมพูหวานฟรุ้งฟริ้ง',
                          icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          )
                        },
                        {
                          id: 'fire_sparks',
                          title: 'Fire Sparks',
                          desc: 'สะเก็ดไฟลุกโชนดุดัน',
                          icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                            </svg>
                          )
                        },
                        {
                          id: 'none',
                          title: 'ปิดเอฟเฟกต์ละออง',
                          desc: 'ไม่แสดงละอองใดๆ',
                          icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                          )
                        }
                      ].map((item) => {
                        const currentStyle = (settings.alert_confetti_enabled === 'false' || settings.alert_confetti_enabled === false)
                          ? 'none'
                          : (settings.alert_particle_style || 'confetti');
                        const isSelected = currentStyle === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`particle-style-card ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              updateField('alert_particle_style', item.id);
                              updateField('alert_confetti_enabled', item.id !== 'none' ? 'true' : 'false');
                              setIsAnimating(true);
                              setTimeout(() => setIsAnimating(false), 50);
                            }}
                          >
                            <div className="particle-style-icon">
                              {item.icon}
                            </div>
                            <div className="particle-style-title">{item.title}</div>
                            <div className="particle-style-desc">{item.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 7. TTS & Voice Selection Section */}
                <div className="panel-section">
                  <div className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    ระบบเสียงอ่านข้อความ (Text-to-Speech)
                  </div>
                  <p className="section-desc">
                    ตั้งค่าระบบอ่านออกเสียงชื่อ ยอดเงิน และข้อความโดเนทภาษาไทย
                  </p>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">สถานะระบบอ่านออกเสียง (TTS)</label>
                      <select
                        className="input-control"
                        value={String(settings.tts_enabled ?? 'true')}
                        onChange={(e) => updateField('tts_enabled', e.target.value)}
                      >
                        <option value="true">เปิดใช้งาน (อ่านชื่อ ยอดเงิน และข้อความ)</option>
                        <option value="false">ปิดใช้งาน (ไม่ส่งเสียงอ่าน)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">ยอดเงินขั้นต่ำที่จะให้อ่าน TTS (บาท)</label>
                      <input
                        type="number"
                        className="input-control"
                        min="1"
                        value={settings.tts_min_amount ?? 20}
                        onChange={(e) => updateField('tts_min_amount', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* TTS Engine Info Banner */}
                  <div className="customizer-subbox" style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: "var(--accent-soft)",
                      color: 'var(--accent, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Volume2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                        เครื่องมือเสียงอ่านภาษาไทย (Google TTS)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                        ระบบอ่านออกเสียงชื่อผู้โดเนท ยอดเงิน และข้อความโดเนทภาษาไทยอัตโนมัติ
                      </div>
                    </div>
                  </div>

                  {/* Sound Selection (Feature 2.1) */}
                  <div className="form-row full-width" style={{ marginTop: '16px' }}>
                    <div className="form-group full-width">
                      <div className="field-label-row" style={{ alignItems: 'center' }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                          เสียงแจ้งเตือน (Alert Sound)
                        </label>
                        <button
                          type="button"
                          className="btn-test-sound"
                          onClick={handleTestAlertSound}
                          disabled={isPlayingAlertSound}
                        >
                          {isPlayingAlertSound ? 'กำลังเล่น...' : 'ทดลองฟังเสียง'}
                        </button>
                      </div>

                      {/* 2 Tabs: Segmented Control */}
                      <div className="sound-segmented-tabs">
                        <button
                          type="button"
                          className={`sound-tab-btn ${soundMode === 'preset' ? 'active' : ''}`}
                          onClick={() => {
                            setSoundMode('preset');
                            const isCurrentPreset = ALERT_SOUND_PRESETS.some(p => p.id !== 'custom' && p.id === settings.alert_sound_url);
                            if (!isCurrentPreset) {
                              updateField('alert_sound_url', '/sounds/alert.mp3');
                            }
                          }}
                        >
                          เสียงมาตรฐาน (5 แบบ)
                        </button>
                        <button
                          type="button"
                          className={`sound-tab-btn ${soundMode === 'custom' ? 'active' : ''}`}
                          onClick={() => setSoundMode('custom')}
                        >
                          อัปโหลดไฟล์ / วางลิงก์เอง
                        </button>
                      </div>

                      {soundMode === 'preset' ? (
                        <div style={{ marginTop: '4px' }}>
                          <select
                            className="input-control"
                            value={
                              ALERT_SOUND_PRESETS.some(p => p.id !== 'custom' && p.id === settings.alert_sound_url)
                                ? settings.alert_sound_url
                                : '/sounds/alert.mp3'
                            }
                            onChange={(e) => updateField('alert_sound_url', e.target.value)}
                          >
                            {ALERT_SOUND_PRESETS.filter(p => p.id !== 'custom').map((p) => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="sound-upload-card">
                          <label className="sound-dropzone-clicker">
                            <input
                              type="file"
                              accept=".mp3,.wav,.ogg"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleSoundUpload(file);
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', color: 'var(--text-muted)' }}>
                              <Upload size={24} />
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                              {uploadingSound ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์เสียง (.mp3, .wav, .ogg)'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              ระบบจะจัดเก็บไฟล์เสียงและสร้าง URL ให้อัตโนมัติ (สูงสุด 25MB)
                            </div>
                          </label>

                          <div className="sound-upload-divider">
                            <div className="field-label-row" style={{ marginBottom: '6px' }}>
                              <label className="form-label" style={{ fontSize: '12px', marginBottom: 0, color: 'var(--text-muted)' }}>
                                หรือระบุลิงก์ URL เสียงตรงนี้
                              </label>
                              <button
                                type="button"
                                className="sound-reset-link"
                                onClick={() => {
                                  updateField('alert_sound_url', '/sounds/alert.mp3');
                                  setSoundMode('preset');
                                }}
                              >
                                รีเซ็ตเป็นกระดิ่งเดิม
                              </button>
                            </div>
                            <input
                              type="text"
                              className="input-control"
                              placeholder="เช่น /sounds/alert.mp3 หรือ https://..."
                              value={settings.alert_sound_url || ''}
                              onChange={(e) => updateField('alert_sound_url', e.target.value)}
                              style={{ fontSize: '12px' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sound & Volume */}
                  <div className="form-row full-width" style={{ marginTop: '12px' }}>
                    <div className="form-group full-width">
                      <label className="form-label">
                        <span>ระดับความดังเสียงแจ้งเตือน & TTS ({settings.alert_volume || 80}%)</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.alert_volume || 80}
                        onChange={(e) => updateField('alert_volume', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* Audio Listen Test Box */}
                  <div className="tts-test-box">
                    <div className="tts-test-input-wrap">
                      <span className="tts-test-label">ข้อความจำลองที่จะทดสอบอ่าน:</span>
                      <div className="tts-test-sample-text">
                        "{testName || 'สมชาย ใจดี'} โดเนทให้ {testAmount || 50} บาท {testMessage || 'เป็นกำลังใจให้นะครับ สตรีมสนุกมาก!'}"
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn-tts-listen ${isPlayingTts ? 'playing' : ''}`}
                      onClick={handleTestTtsVoice}
                      disabled={isPlayingTts}
                    >
                      {isPlayingTts ? (
                        <>
                          <span className="pulse-dot active"></span>
                          <span>กำลังเล่นเสียงตัวอย่าง...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={16} />
                          <span>ทดลองฟังเสียงอ่าน</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: TIERED ALERTS */}
            {activeCategoryTab === 'tiered' && (
              <>
                {/* Section: Tiered Alert Text Colors */}
                <div className="panel-section">
                  <div className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    ระบบสีตามระดับยอดเงิน (Tiered Styling)
                  </div>
                  <p className="section-desc">
                    กำหนดสีตัวอักษรและเอฟเฟกต์แยกตามระดับยอดเงินบริจาค (Common, Rare, Epic, Legendary)
                  </p>

                  <div className="form-row" style={{ marginBottom: '12px' }}>
                    <div className="form-group" style={{ width: '100%' }}>
                      <label className="form-label">เปิดใช้งานสีตามระดับยอดเงิน (Tiered Styling)</label>
                      <select
                        className="input-control"
                        value={String(settings.alert_tiered_enabled !== 'false' && settings.alert_tiered_enabled !== false)}
                        onChange={(e) => updateField('alert_tiered_enabled', e.target.value)}
                      >
                        <option value="true">เปิดใช้งาน (เปลี่ยนสีตามระดับยอดเงิน)</option>
                        <option value="false">ปิดใช้งาน (ใช้สีปกติเท่ากันทุกยอด)</option>
                      </select>
                    </div>
                  </div>

                  {/* Common Tier Controls */}
                  <div className="form-row" style={{ marginBottom: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">ระดับทั่วไป Common</label>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ยอดเงินตั้งแต่เริ่มต้นจนถึงก่อน Rare</span>
                    </div>
                    <div className="form-group">
                      {settings.alert_text_gradient_enabled === 'true' ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>สีไล่ระดับ Common (Start ➔ End)</label>
                            <span style={{
                              display: 'inline-block',
                              width: '32px',
                              height: '14px',
                              borderRadius: '4px',
                              border: "1px solid var(--border)",
                              background: `linear-gradient(135deg, ${settings.alert_tiered_common_from || '#22c55e'}, ${settings.alert_tiered_common_to || '#10b981'})`
                            }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_tiered_common_from?.startsWith('#') ? settings.alert_tiered_common_from : '#22c55e'}
                                onChange={(e) => {
                                  updateField('alert_tiered_common_from', e.target.value);
                                  updateField('alert_tiered_common_color', e.target.value);
                                }}
                                title="สีเริ่มต้น"
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_tiered_common_from || '#22c55e'}
                                onChange={(e) => {
                                  updateField('alert_tiered_common_from', e.target.value);
                                  updateField('alert_tiered_common_color', e.target.value);
                                }}
                              />
                            </div>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_tiered_common_to?.startsWith('#') ? settings.alert_tiered_common_to : '#10b981'}
                                onChange={(e) => updateField('alert_tiered_common_to', e.target.value)}
                                title="สีปลายทาง"
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_tiered_common_to || '#10b981'}
                                onChange={(e) => updateField('alert_tiered_common_to', e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="form-label">สีตัวอักษร Common</label>
                          <div className="color-input-wrap">
                            <input
                              type="color"
                              value={settings.alert_tiered_common_color?.startsWith('#') ? settings.alert_tiered_common_color : '#22c55e'}
                              onChange={(e) => updateField('alert_tiered_common_color', e.target.value)}
                            />
                            <input
                              type="text"
                              className="hex-input"
                              value={settings.alert_tiered_common_color || '#22c55e'}
                              onChange={(e) => updateField('alert_tiered_common_color', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rare Tier Controls */}
                  <div className="form-row" style={{ marginBottom: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">ยอดขั้นต่ำ Rare (บาท)</label>
                      <input
                        type="number"
                        className="input-control"
                        min="1"
                        value={settings.alert_tiered_rare_min ?? 50}
                        onChange={(e) => updateField('alert_tiered_rare_min', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      {settings.alert_text_gradient_enabled === 'true' ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>สีไล่ระดับ Rare (Start ➔ End)</label>
                            <span style={{
                              display: 'inline-block',
                              width: '32px',
                              height: '14px',
                              borderRadius: '4px',
                              border: "1px solid var(--border)",
                              background: `linear-gradient(135deg, ${settings.alert_tiered_rare_from || '#00c6ff'}, ${settings.alert_tiered_rare_to || '#0072ff'})`
                            }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_tiered_rare_from?.startsWith('#') ? settings.alert_tiered_rare_from : '#00c6ff'}
                                onChange={(e) => {
                                  updateField('alert_tiered_rare_from', e.target.value);
                                  updateField('alert_tiered_rare_color', e.target.value);
                                }}
                                title="สีเริ่มต้น"
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_tiered_rare_from || '#00c6ff'}
                                onChange={(e) => {
                                  updateField('alert_tiered_rare_from', e.target.value);
                                  updateField('alert_tiered_rare_color', e.target.value);
                                }}
                              />
                            </div>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_tiered_rare_to?.startsWith('#') ? settings.alert_tiered_rare_to : '#0072ff'}
                                onChange={(e) => updateField('alert_tiered_rare_to', e.target.value)}
                                title="สีปลายทาง"
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_tiered_rare_to || '#0072ff'}
                                onChange={(e) => updateField('alert_tiered_rare_to', e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="form-label">สีตัวอักษร Rare</label>
                          <div className="color-input-wrap">
                            <input
                              type="color"
                              value={settings.alert_tiered_rare_color?.startsWith('#') ? settings.alert_tiered_rare_color : '#0284c7'}
                              onChange={(e) => updateField('alert_tiered_rare_color', e.target.value)}
                            />
                            <input
                              type="text"
                              className="hex-input"
                              value={settings.alert_tiered_rare_color || '#0284c7'}
                              onChange={(e) => updateField('alert_tiered_rare_color', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Epic Tier Controls */}
                  <div className="form-row" style={{ marginBottom: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">ยอดขั้นต่ำ Epic (บาท)</label>
                      <input
                        type="number"
                        className="input-control"
                        min="1"
                        value={settings.alert_tiered_epic_min ?? 200}
                        onChange={(e) => updateField('alert_tiered_epic_min', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      {settings.alert_text_gradient_enabled === 'true' ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>สีไล่ระดับ Epic (Start ➔ End)</label>
                            <span style={{
                              display: 'inline-block',
                              width: '32px',
                              height: '14px',
                              borderRadius: '4px',
                              border: "1px solid var(--border)",
                              background: `linear-gradient(135deg, ${settings.alert_tiered_epic_from || '#da22ff'}, ${settings.alert_tiered_epic_to || '#9733ee'})`
                            }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_tiered_epic_from?.startsWith('#') ? settings.alert_tiered_epic_from : '#da22ff'}
                                onChange={(e) => {
                                  updateField('alert_tiered_epic_from', e.target.value);
                                  updateField('alert_tiered_epic_color', e.target.value);
                                }}
                                title="สีเริ่มต้น"
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_tiered_epic_from || '#da22ff'}
                                onChange={(e) => {
                                  updateField('alert_tiered_epic_from', e.target.value);
                                  updateField('alert_tiered_epic_color', e.target.value);
                                }}
                              />
                            </div>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_tiered_epic_to?.startsWith('#') ? settings.alert_tiered_epic_to : '#9733ee'}
                                onChange={(e) => updateField('alert_tiered_epic_to', e.target.value)}
                                title="สีปลายทาง"
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_tiered_epic_to || '#9733ee'}
                                onChange={(e) => updateField('alert_tiered_epic_to', e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="form-label">สีตัวอักษร Epic</label>
                          <div className="color-input-wrap">
                            <input
                              type="color"
                              value={settings.alert_tiered_epic_color?.startsWith('#') ? settings.alert_tiered_epic_color : '#9333ea'}
                              onChange={(e) => updateField('alert_tiered_epic_color', e.target.value)}
                            />
                            <input
                              type="text"
                              className="hex-input"
                              value={settings.alert_tiered_epic_color || '#9333ea'}
                              onChange={(e) => updateField('alert_tiered_epic_color', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legendary Tier Controls */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">ยอดขั้นต่ำ Legendary (บาท)</label>
                      <input
                        type="number"
                        className="input-control"
                        min="1"
                        value={settings.alert_tiered_legendary_min ?? 500}
                        onChange={(e) => updateField('alert_tiered_legendary_min', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      {settings.alert_text_gradient_enabled === 'true' ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>สีไล่ระดับ Legendary (Start ➔ End)</label>
                            <span style={{
                              display: 'inline-block',
                              width: '32px',
                              height: '14px',
                              borderRadius: '4px',
                              border: "1px solid var(--border)",
                              background: `linear-gradient(135deg, ${settings.alert_tiered_legendary_from || '#f12711'}, ${settings.alert_tiered_legendary_to || '#f5af19'})`
                            }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_tiered_legendary_from?.startsWith('#') ? settings.alert_tiered_legendary_from : '#f12711'}
                                onChange={(e) => {
                                  updateField('alert_tiered_legendary_from', e.target.value);
                                  updateField('alert_tiered_legendary_color', e.target.value);
                                }}
                                title="สีเริ่มต้น"
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_tiered_legendary_from || '#f12711'}
                                onChange={(e) => {
                                  updateField('alert_tiered_legendary_from', e.target.value);
                                  updateField('alert_tiered_legendary_color', e.target.value);
                                }}
                              />
                            </div>
                            <div className="color-input-wrap">
                              <input
                                type="color"
                                value={settings.alert_tiered_legendary_to?.startsWith('#') ? settings.alert_tiered_legendary_to : '#f5af19'}
                                onChange={(e) => updateField('alert_tiered_legendary_to', e.target.value)}
                                title="สีปลายทาง"
                              />
                              <input
                                type="text"
                                className="hex-input"
                                value={settings.alert_tiered_legendary_to || '#f5af19'}
                                onChange={(e) => updateField('alert_tiered_legendary_to', e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="form-label">สีตัวอักษร Legendary</label>
                          <div className="color-input-wrap">
                            <input
                              type="color"
                              value={settings.alert_tiered_legendary_color?.startsWith('#') ? settings.alert_tiered_legendary_color : '#ea580c'}
                              onChange={(e) => updateField('alert_tiered_legendary_color', e.target.value)}
                            />
                            <input
                              type="text"
                              className="hex-input"
                              value={settings.alert_tiered_legendary_color || '#ea580c'}
                              onChange={(e) => updateField('alert_tiered_legendary_color', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons Bar */}
            <div className="action-bar-bottom">
              <button
                type="button"
                className="btn btn-save-big"
                onClick={handleSave}
                disabled={isSaving}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกและส่งขึ้น OBS ทันที'}</span>
              </button>

              <button
                type="button"
                className="btn secondary"
                onClick={handleResetDefault}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                คืนค่าเริ่มต้น
              </button>
            </div>
          </div>

          {/* Right Column: Sticky Live Preview Simulator */}
          <div className="preview-panel">
            <div className="preview-header">
              <div className="preview-title">
                <span className="pulse-dot"></span>
                <span>หน้าต่างจำลอง OBS Overlay (Live Preview)</span>
              </div>
              <div className="preview-bg-switch">
                <button
                  type="button"
                  className={`bg-btn ${previewBg === 'overlay' ? 'active' : ''}`}
                  onClick={() => setPreviewBg('overlay')}
                >
                  พื้นหลังจริง
                </button>
                <button
                  type="button"
                  className={`bg-btn ${previewBg === 'checker' ? 'active' : ''}`}
                  onClick={() => setPreviewBg('checker')}
                >
                  ตารางโปร่งใส
                </button>
                <button
                  type="button"
                  className={`bg-btn ${previewBg === 'game' ? 'active' : ''}`}
                  onClick={() => setPreviewBg('game')}
                >
                  เกมมืด
                </button>
                <button
                  type="button"
                  className={`bg-btn ${previewBg === 'bright' ? 'active' : ''}`}
                  onClick={() => setPreviewBg('bright')}
                >
                  ห้องสว่าง
                </button>
              </div>
            </div>

            {/* Simulator Stage Area */}
            <div className={`preview-stage bg-${previewBg}`}>
              <AlertCard
                settings={settings}
                alert={{
                  name: testName,
                  amount: testAmount !== '' && !isNaN(Number(testAmount)) ? Number(testAmount) : 0,
                  message: testMessage
                }}
                animState={!isAnimating}
              />
            </div>

            {/* Test Alert Data Configuration Card */}
            <div className="test-data-card">
              <div className="test-data-header">
                <div className="test-data-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>กำหนดข้อความและข้อมูลทดสอบ</span>
                </div>
                <div className="test-presets-wrap" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="test-preset-btn"
                    style={{ borderColor: settings.alert_tiered_common_color || '#22c55e' }}
                    onClick={() => {
                      setTestName('สมชาย ใจดี');
                      setTestAmount(20);
                      setTestMessage('สวัสดีครับ เป็นกำลังใจให้นะครับ สตรีมสนุกมาก!');
                      setIsAnimating(true);
                      setTimeout(() => setIsAnimating(false), 50);
                    }}
                  >
                    <span className="tier-dot" style={{ background: settings.alert_tiered_common_color || '#22c55e' }} />
                    <span>Common (20฿)</span>
                  </button>
                  <button
                    type="button"
                    className="test-preset-btn"
                    style={{ borderColor: settings.alert_tiered_rare_color || '#00c6ff' }}
                    onClick={() => {
                      setTestName('ฟ้าใส สดชื่น');
                      setTestAmount(100);
                      setTestMessage('ชอบคอนเทนต์และเสียงพูดมากครับ สู้ๆ');
                      setIsAnimating(true);
                      setTimeout(() => setIsAnimating(false), 50);
                    }}
                  >
                    <span className="tier-dot" style={{ background: settings.alert_tiered_rare_color || '#00c6ff' }} />
                    <span>Rare (100฿)</span>
                  </button>
                  <button
                    type="button"
                    className="test-preset-btn"
                    style={{ borderColor: settings.alert_tiered_epic_color || '#a855f7' }}
                    onClick={() => {
                      setTestName('เสี่ยท็อป สายเปย์');
                      setTestAmount(300);
                      setTestMessage('สุดยอดมากครับ เป็นกำลังใจให้พัฒนาต่อไปเรื่อยๆ');
                      setIsAnimating(true);
                      setTimeout(() => setIsAnimating(false), 50);
                    }}
                  >
                    <span className="tier-dot" style={{ background: settings.alert_tiered_epic_color || '#a855f7' }} />
                    <span>Epic (300฿)</span>
                  </button>
                  <button
                    type="button"
                    className="test-preset-btn"
                    style={{ borderColor: settings.alert_tiered_legendary_color || '#f59e0b' }}
                    onClick={() => {
                      setTestName('สุลต่าน ใจป๋า');
                      setTestAmount(1000);
                      setTestMessage('เติมพลังให้สตรีมเมอร์ สู้ๆ นะครับ!');
                      setIsAnimating(true);
                      setTimeout(() => setIsAnimating(false), 50);
                    }}
                  >
                    <span className="tier-dot" style={{ background: settings.alert_tiered_legendary_color || '#f59e0b' }} />
                    <span>Legendary (1,000฿)</span>
                  </button>
                </div>
              </div>

              <div className="test-data-grid">
                <div className="test-field">
                  <label>ชื่อผู้โดเนท (Donor Name)</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี, Anonymous"
                    maxLength={50}
                  />
                </div>
                <div className="test-field">
                  <label>ยอดเงิน (บาท)</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={e => setTestAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="50"
                    min={1}
                    step={1}
                  />
                </div>
              </div>

              <div className="test-field">
                <label>
                  <span>ข้อความโดเนท (Message)</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 400 }}>
                    {testMessage.length}/200 ตัวอักษร
                  </span>
                </label>
                <textarea
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการให้แสดงและอ่านออกเสียง TTS..."
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Preview Interactive Controls */}
            <div className="preview-controls-box">
              <button
                type="button"
                className="btn-action-preview"
                onClick={handleTriggerAnimation}
              >
                <Play size={16} />
                <span>ทดสอบเล่นอนิเมชั่น</span>
              </button>

              <button
                type="button"
                className="btn-action-obs"
                onClick={handleTestRealObs}
              >
                <Send size={16} />
                <span>ทดสอบแจ้งเตือน Overlay</span>
              </button>
            </div>

            <div className="obs-url-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                <Link2 size={15} />
                <span>OBS Browser Source URL</span>
              </div>
              <div className="url-copy-box">
                <code>{obsUrl}</code>
                <button type="button" className="btn secondary sm" onClick={handleCopyObsUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Copy size={13} />
                  <span>คัดลอก</span>
                </button>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4, margin: '8px 0 0 0' }}>
                ซิงค์ค่าไปยัง OBS Studio อัตโนมัติแบบเรียลไทม์เมื่อกดบันทึก
              </p>
            </div>

            {/* TikTok Live Studio (No BG / Frameless) Dedicated URL */}
            <div
              className="obs-url-card"
              style={{
                marginTop: '12px',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  <Smartphone size={15} style={{ color: '#f43f5e' }} />
                  <span>TikTok Live Studio (ไร้พื้นหลัง / No BG)</span>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    background: 'rgba(244, 63, 94, 0.14)',
                    color: '#f43f5e',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Sparkles size={11} /> TikTok Live
                </span>
              </div>
              <div className="url-copy-box">
                <code style={{ color: '#f43f5e', fontWeight: 600 }}>{obsUrl}?tiktok=1</code>
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={handleCopyTikTokUrl}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                >
                  <Copy size={13} />
                  <span>คัดลอก</span>
                </button>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4, margin: '8px 0 0 0' }}>
                ⚡ ลบกรอบ/พื้นหลังการ์ดให้อัตโนมัติ 100% ตัวหนังสือลอยคมชัด เหมาะกับไลฟ์แนวตั้ง TikTok Live Studio
              </p>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        <div className={`toast ${toastMessage ? 'show success' : ''}`}>
          {toastMessage}
        </div>
      </div>
    </div>
  );
}
