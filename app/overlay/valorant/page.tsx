'use client';

import React, { useEffect, useState, useRef } from 'react';
import ValorantCard from './ValorantCard';
import { ValorantRankData, ValorantSettings } from '@/lib/types/valorant';
import { valorantDefaults, readValorantSettings } from '@/lib/valorantSettings';
import { supabase } from '@/lib/supabaseClient';
import './valorant.css';

export default function ValorantOverlayPage() {
  const [data, setData] = useState<ValorantRankData | null>(null);
  const [settings, setSettings] = useState<ValorantSettings>(valorantDefaults);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRank = async () => {
    try {
      const res = await fetch('/api/valorant', { cache: 'no-store' });
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else if (result.notConfigured) {
        setError('กรุณาตั้งค่า Valorant Riot ID และ API Key ในหน้าแอดมิน');
      } else {
        setError(result.message || 'ไม่สามารถโหลดข้อมูลอันดับได้');
      }
      if (result.settings) {
        setSettings(prev => ({ ...prev, ...result.settings }));
      }
    } catch (err: any) {
      console.warn('Valorant fetch error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('valorant-overlay-body');

    // Initial fetch
    void fetchRank();

    // 60-second auto refresh interval
    const interval = setInterval(() => {
      void fetchRank();
    }, 60000);

    // Listen to realtime settings update from Admin
    const channel = supabase.channel('donation-alerts')
      .on('broadcast', { event: 'settings_updated' }, () => {
        void fetchRank();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
      document.body.classList.remove('valorant-overlay-body');
    };
  }, []);

  return (
    <div style={{ padding: '20px', minHeight: '100vh', boxSizing: 'border-box' }}>
      <ValorantCard 
        data={data}
        settings={settings}
        loading={loading}
        error={error}
      />
    </div>
  );
}

