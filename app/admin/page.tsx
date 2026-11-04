'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SkipForward, Pause, Play, Send } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Donation } from '@/lib/types/database';
import { StatCard, StatCardSkeleton, Skeleton } from '@/app/components';
import { useAdmin } from './AdminContext';

function AdminOverviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, handleUnauthorized, refreshCounts } = useAdmin();

  const [stats, setStats] = useState<{
    count: number;
    totalAmount: number;
    todayCount: number;
    todayAmount: number;
    topDonator?: string;
  }>({
    count: 0,
    totalAmount: 0,
    todayCount: 0,
    todayAmount: 0,
    topDonator: '-'
  });
  const [quota, setQuota] = useState<any>(null);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isQueuePaused, setIsQueuePaused] = useState<boolean>(false);

  const [testName, setTestName] = useState<string>('Naaa ผู้สนับสนุนตัวอย่าง');
  const [testAmount, setTestAmount] = useState<string>('50');
  const [testMessage, setTestMessage] = useState<string>('สู้ๆ ครับแอดมิน เล่นเกมเก่งมาก!');

  // Redirect legacy ?tab= queries to new routes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'tabDonations') {
      router.replace('/admin/donations');
    } else if (tab === 'tabSettings') {
      router.replace('/admin/settings');
    } else if (tab === 'tabBlacklist') {
      router.replace('/admin/blacklist');
    }
  }, [searchParams, router]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const sRes = await fetch('/api/admin/stats', { headers: { 'Content-Type': 'application/json' } });
      if (sRes.status === 401) {
        handleUnauthorized();
        return;
      }
      const sData = await sRes.json();
      if (sData.success) {
        setStats(sData.stats);
        if (sData.quota) setQuota(sData.quota);
      }

      const dRes = await fetch('/api/admin/donations?limit=5', { headers: { 'Content-Type': 'application/json' } });
      const dData = await dRes.json();
      if (dData.success) {
        setRecentDonations(dData.donations || []);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    void fetchData();

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('donation-alerts');
      bc.onmessage = (event) => {
        if (event.data?.type === 'donation' && !event.data?.payload?.isTest) {
          void fetchData(true);
          refreshCounts();
        }
      };
    }

    const channel = supabase
      .channel('admin-overview-live')
      .on('broadcast', { event: 'donation' }, (payload: any) => {
        if (!payload?.payload?.isTest) {
          void fetchData(true);
          refreshCounts();
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (bc) bc.close();
    };
  }, [fetchData, refreshCounts]);

  const topDonator = useMemo(() => {
    if (stats.topDonator && stats.topDonator !== '-') return stats.topDonator;
    const verifiedList = recentDonations.filter(d => d.status !== 'failed' && d.status !== 'pending');
    if (!verifiedList.length) return '-';
    const donatorTotals: Record<string, number> = {};
    verifiedList.forEach(d => {
      const name = (d.name || 'Anonymous').trim();
      donatorTotals[name] = (donatorTotals[name] || 0) + (parseFloat(String(d.amount)) || 0);
    });
    let top = '-';
    let max = 0;
    for (const [name, total] of Object.entries(donatorTotals)) {
      if (total > max) {
        max = total;
        top = `${name} (฿${total.toLocaleString()})`;
      }
    }
    return top;
  }, [stats.topDonator, recentDonations]);

  const handleAlertControl = async (action: 'skip_alert' | 'pause_queue' | 'resume_queue') => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('donation-alerts');
          bc.postMessage({ type: action });
          bc.close();
        } catch {}
      }

      const res = await fetch('/api/admin/alert-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success) {
        if (action === 'pause_queue') setIsQueuePaused(true);
        if (action === 'resume_queue') setIsQueuePaused(false);
        showToast(data.message);
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  const handleSendTestAlert = async () => {
    try {
      // Broadcast locally via BroadcastChannel for instant same-browser cross-tab delivery
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('donation-alerts');
          bc.postMessage({
            type: 'donation',
            payload: {
              id: 'test-admin-' + Date.now(),
              name: testName || 'ผู้ชมทดสอบ',
              amount: parseFloat(testAmount) || 50,
              message: testMessage || 'ทดสอบระบบ Alert ขึ้นจอ OBS',
              sender_bank: 'TEST',
              created_at: new Date().toLocaleTimeString('th-TH'),
              isTest: true
            }
          });
          bc.close();
        } catch (e) {}
      }

      const res = await fetch('/api/admin/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          amount: parseFloat(testAmount) || 50,
          message: testMessage
        })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success) {
        showToast('ส่ง Test Alert ขึ้นหน้าจอ OBS เรียบร้อยแล้ว!');
        refreshCounts();
      } else {
        alert(data.message || 'ส่ง Test Alert ไม่สำเร็จ');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  return (
    <>
      {/* Stats Overview Cards */}
      <div className="stats-grid">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              iconVariant="green"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              }
              title="ยอดโดเนทวันนี้"
              value={`฿${(stats.todayAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={`${stats.todayCount || 0} รายการ`}
            />

            <StatCard
              iconVariant="blue"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              }
              title="ยอดรวมทั้งหมด"
              value={`฿${(stats.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={`${stats.count || 0} รายการ`}
            />

            <StatCard
              iconVariant="purple"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path>
                  <line x1="13" y1="5" x2="13" y2="19" strokeDasharray="2"></line>
                </svg>
              }
              title="โควต้า SlipOK คงเหลือ"
              value={quota ? `${quota.quota ?? quota.remaining ?? quota.limit ?? 100} สลิป` : '100 สลิป'}
              subtitle={quota ? (quota.endDate ? `หมดอายุ ${quota.endDate}` : quota.status ? `สถานะ: ${quota.status}` : 'ปกติ') : 'ตรวจสอบสถานะ...'}
            />

            <StatCard
              iconVariant="orange"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
              }
              title="ผู้สนับสนุนสูงสุด"
              value={<span style={{ fontSize: '17px', wordBreak: 'break-word' }}>{topDonator}</span>}
              subtitle="Top Supporter"
            />
          </>
        )}
      </div>
      {/* Live Stream Alert Control Bar */}
      <div className="panel" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: isQueuePaused ? '#f59e0b' : '#22c55e',
                display: 'inline-block'
              }} />
              <span>ควบคุมการแจ้งเตือนสดบนจอ OBS (Live Alert Controls)</span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isQueuePaused
                ? 'สถานะคิว: พักการแสดง Alert ชั่วคราว (รายการใหม่จะถูกเก็บเข้าคิวรอไว้)'
                : 'สถานะคิว: พร้อมแสดงผลปกติ (สั่งข้ามเสียงอ่าน TTS หรือยิงทดสอบได้ทันที)'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn secondary sm"
              onClick={() => handleAlertControl('skip_alert')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="ข้ามการ์ดแจ้งเตือนที่กำลังแสดงและตัดเสียงอ่าน TTS ทันที"
            >
              <SkipForward size={14} />
              <span>ข้าม Alert / หยุด TTS</span>
            </button>

            <button
              type="button"
              className={`btn sm ${isQueuePaused ? 'primary' : 'secondary'}`}
              onClick={() => handleAlertControl(isQueuePaused ? 'resume_queue' : 'pause_queue')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title={isQueuePaused ? 'กลับมาเล่นคิวแจ้งเตือนที่ค้างอยู่ต่อ' : 'พักการเด้งแจ้งเตือนชั่วคราว'}
            >
              {isQueuePaused ? <Play size={14} /> : <Pause size={14} />}
              <span>{isQueuePaused ? 'เล่นคิว Alert ต่อ' : 'พักคิว Alert'}</span>
            </button>

            <button
              type="button"
              className="btn primary sm"
              onClick={handleSendTestAlert}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="ส่งแจ้งเตือนจำลองไปยังหน้าจอ OBS ทันที"
            >
              <Send size={14} />
              <span>ส่ง Test Alert (50฿)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Donations Preview */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            รายการโดเนทล่าสุด
          </h2>
          <Link href="/admin/donations" className="btn secondary sm" style={{ textDecoration: 'none' }}>
            ดูประวัติทั้งหมด ({stats.count || 0}) →
          </Link>
        </div>

        {isLoading ? (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>วัน-เวลา</th>
                  <th>ชื่อผู้สนับสนุน</th>
                  <th>ยอดเงิน</th>
                  <th>ข้อความ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((key) => (
                  <tr key={key} aria-hidden="true">
                    <td><Skeleton width="130px" height="15px" /></td>
                    <td><Skeleton width="110px" height="15px" /></td>
                    <td><Skeleton width="70px" height="15px" /></td>
                    <td><Skeleton width="180px" height="15px" /></td>
                    <td><Skeleton width="65px" height="22px" radius="9999px" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : recentDonations.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>ยังไม่มีรายการโดเนท</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>วัน-เวลา</th>
                  <th>ชื่อผู้สนับสนุน</th>
                  <th>ยอดเงิน</th>
                  <th>ข้อความ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.map((item) => (
                  <tr key={item.id} style={item.status === 'failed' ? { background: 'var(--danger-soft)' } : {}}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '-'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.name || 'ไม่ระบุชื่อ'}</td>
                    <td style={{ fontWeight: 700, color: item.status === 'failed' ? 'var(--text-dim)' : 'var(--success)' }}>
                      {item.status === 'failed' ? (
                        <span style={{ textDecoration: 'line-through', opacity: 0.65 }}>
                          ฿{(parseFloat(String(item.amount)) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        `฿${(parseFloat(String(item.amount)) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td style={{ maxWidth: '280px', wordBreak: 'break-word', color: 'var(--text-muted)' }}>
                      {item.message || '-'}
                    </td>
                    <td>
                      {item.status === 'failed' ? (
                        <span className="badge failed">ไม่ผ่าน</span>
                      ) : item.status === 'pending' ? (
                        <span className="badge pending">รอตรวจสอบ</span>
                      ) : (
                        <span className="badge verified">สำเร็จ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OBS Setup Instructions Guide */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            วิธีเพิ่ม Alert เข้าโปรแกรม OBS Studio
          </h2>
        </div>
        <ol style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, paddingLeft: '20px' }}>
          <li>เปิดโปรแกรม <strong>OBS Studio</strong></li>
          <li>ในช่อง <strong>Sources</strong> กดปุ่มเครื่องหมายบวก <strong>(+)</strong> แล้วเลือก <strong>Browser</strong></li>
          <li>ตั้งชื่อเช่น <code>Donate Alert</code> แล้วกด OK</li>
          <li>ในช่อง <strong>URL</strong> ให้กรอก: <code style={{ color: 'var(--primary)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>http://localhost:3000/overlay</code></li>
          <li>ตั้งค่า <strong>Width:</strong> <code>1920</code> และ <strong>Height:</strong> <code>1080</code> (หรือ 800x600)</li>
          <li>ติ๊กถูกที่ <strong>Shutdown source when not visible</strong> และ <strong>Refresh browser when scene becomes active</strong></li>
          <li>กด <strong>OK</strong> จากนั้นกลับมากดปุ่ม <strong>ส่ง Test Alert</strong> ด้านบนเพื่อเช็คตำแหน่งบนหน้าจอได้ทันที</li>
        </ol>
      </div>
    </>
  );
}

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>กำลังโหลด...</div>}>
      <AdminOverviewContent />
    </Suspense>
  );
}
