'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import './admin.css';
import { supabase } from '@/lib/supabaseClient';
import { Sidebar, MobileTopBar, Toast, SessionWatcher } from '@/app/components';
import { AdminContext } from './AdminContext';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName?: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [donationCount, setDonationCount] = useState<number>(0);
  const [blacklistCount, setBlacklistCount] = useState<number>(0);
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
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('admin_theme', next);
      } catch (e) {}
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  }, []);

  const handleUnauthorized = useCallback(async () => {
    try {
      localStorage.removeItem('donate_admin_token');
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    window.location.href = '/login?expired=true&redirect=/admin';
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('donate_admin_token');
    window.location.href = '/login';
  };

  const fetchCounts = useCallback(async () => {
    try {
      const [statsRes, blRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/admin/blacklist')
      ]);

      if (statsRes.status === 401) {
        handleUnauthorized();
        return;
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.success && sData.stats) {
          setDonationCount(sData.stats.count || 0);
        }
      }

      if (blRes.ok) {
        const bData = await blRes.json();
        if (bData.success && bData.blacklist) {
          setBlacklistCount(bData.blacklist.length || 0);
        }
      }
    } catch (e) {
      console.error('Error fetching admin counts:', e);
    }
  }, [handleUnauthorized]);

  // Check auth user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const meRes = await fetch('/api/auth/me', { headers: { 'Content-Type': 'application/json' } });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated) {
            setCurrentUser(meData.user);
          }
        } else if (meRes.status === 401) {
          handleUnauthorized();
        }
      } catch (e) {
        console.error('Error checking user session:', e);
      }
    };

    fetchUser();
    fetchCounts();
  }, [fetchCounts, handleUnauthorized]);

  // Realtime subscription for incoming donation alerts across all admin routes
  useEffect(() => {
    const channel = supabase.channel('donation-alerts');
    channel
      .on('broadcast', { event: 'donation' }, (payload: any) => {
        const alertData = payload.payload;
        if (alertData && alertData.name) {
          showToast(`มีโดเนทใหม่จากคุณ ${alertData.name} ฿${alertData.amount}`);
        }
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCounts, showToast]);

  const getPageTitle = () => {
    if (pathname?.startsWith('/admin/analytics')) return 'สถิติเชิงลึก & แดชบอร์ด (Analytics)';
    if (pathname?.startsWith('/admin/donations')) return 'ประวัติการโดเนท';
    if (pathname?.startsWith('/admin/settings')) return 'ตั้งค่าระบบ & OBS';
    if (pathname?.startsWith('/admin/widgets')) return 'วิดเจ็ต OBS & เป้าหมาย';
    if (pathname?.startsWith('/admin/simulator')) return 'จำลองจอไลฟ์สตรีม (Live Studio Simulator)';
    if (pathname?.startsWith('/admin/timer')) return 'ระบบจับเวลา & Subathon (Timer)';
    if (pathname?.startsWith('/admin/blacklist')) return 'กรองคำหยาบ (Blacklist)';
    if (pathname?.startsWith('/admin/profile')) return 'จัดการโปรไฟล์ผู้ดูแลระบบ (Profile)';
    return 'Streamer Dashboard';
  };

  return (
    <AdminContext.Provider
      value={{
        showToast,
        currentUser,
        setCurrentUser,
        refreshCounts: fetchCounts,
        donationCount,
        blacklistCount,
        handleUnauthorized,
        theme,
        toggleTheme
      }}
    >
      <div className="admin-layout">
        <SessionWatcher />

        {/* Sidebar Navigation */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          donationCount={donationCount}
          blacklistCount={blacklistCount}
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Main Content Area */}
        <div className="admin-main">
          <MobileTopBar
            onOpenSidebar={() => setIsSidebarOpen(true)}
            title={getPageTitle()}
            rightAction={<span className="brand-badge">SlipOK + OBS</span>}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          <div className="container">
            {children}
          </div>

          {/* Toast Notification */}
          <Toast message={toastMessage} />
        </div>
      </div>
    </AdminContext.Provider>
  );
}
