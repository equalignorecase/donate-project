'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit3, RefreshCw, X, AlertTriangle, MoreHorizontal, Play } from 'lucide-react';
import { Donation } from '@/lib/types/database';
import { Skeleton } from '@/app/components';
import { useAdmin } from '../AdminContext';

export default function AdminDonationsPage() {
  const { showToast, handleUnauthorized, refreshCounts } = useAdmin();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'failed'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isClearFailedOpen, setIsClearFailedOpen] = useState<boolean>(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states for Create / Edit
  const [formName, setFormName] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('verified');
  const [formRef, setFormRef] = useState<string>('');
  const [formTriggerAlert, setFormTriggerAlert] = useState<boolean>(false);

  const isAnyModalOpen = isCreateOpen || isEditOpen || isDeleteOpen || isClearFailedOpen;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close action dropdown on outside click or Escape
  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-dropdown-container')) {
        setOpenMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  // Lock background scroll and disable sidebar interaction when any modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        setIsDeleteOpen(false);
        setIsClearFailedOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen, isSubmitting]);

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/donations?limit=500', {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations || []);
        refreshCounts();
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleReplayAlert = async (item: Donation) => {
    if (item.status === 'failed') return;
    try {
      const res = await fetch('/api/admin/replay-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          amount: item.amount,
          message: item.message
        })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success) {
        showToast(`เล่นซ้ำการแจ้งเตือนของ ${item.name || 'ไม่ระบุชื่อ'} (฿${item.amount}) แล้ว!`);
      } else {
        alert(data.message || 'เล่นซ้ำการแจ้งเตือนไม่สำเร็จ');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormName('');
    setFormAmount('');
    setFormMessage('');
    setFormStatus('verified');
    setFormRef('');
    setFormTriggerAlert(false);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: Donation) => {
    setSelectedDonation(item);
    setFormName(item.name || '');
    setFormAmount(String(item.amount || ''));
    setFormMessage(item.message || '');
    setFormStatus(item.status || 'verified');
    setFormRef(item.transaction_ref || item.trans_ref || '');
    setFormTriggerAlert(false);
    setIsEditOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item: Donation) => {
    setSelectedDonation(item);
    setIsDeleteOpen(true);
  };

  // Save Create
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('กรุณาระบุยอดเงินให้ถูกต้อง (มากกว่า 0 บาท)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim() || 'ผู้สนับสนุนนิรนาม',
          amount: parsedAmount,
          message: formMessage.trim(),
          status: formStatus,
          transaction_ref: formRef.trim(),
          triggerAlert: formTriggerAlert
        })
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (data.success) {
        showToast('เพิ่มรายการโดเนทเรียบร้อยแล้ว!');
        setIsCreateOpen(false);
        fetchDonations();
      } else {
        alert(data.message || 'เพิ่มรายการไม่สำเร็จ');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation?.id) return;

    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('กรุณาระบุยอดเงินให้ถูกต้อง (มากกว่า 0 บาท)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/donations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDonation.id,
          name: formName.trim() || 'ผู้สนับสนุนนิรนาม',
          amount: parsedAmount,
          message: formMessage.trim(),
          status: formStatus,
          transaction_ref: formRef.trim(),
          triggerAlert: formTriggerAlert
        })
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (data.success) {
        showToast('แก้ไขข้อมูลการโดเนทเรียบร้อยแล้ว!');
        setIsEditOpen(false);
        fetchDonations();
      } else {
        alert(data.message || 'แก้ไขข้อมูลไม่สำเร็จ');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Single Delete
  const handleConfirmDelete = async () => {
    if (!selectedDonation?.id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/donations?id=${selectedDonation.id}`, {
        method: 'DELETE'
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (data.success) {
        showToast('ลบรายการโดเนทเรียบร้อยแล้ว');
        setIsDeleteOpen(false);
        setSelectedDonation(null);
        fetchDonations();
      } else {
        alert(data.message || 'ลบรายการไม่สำเร็จ');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Clear All Failed
  const handleConfirmClearFailed = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/donations?scope=failed', {
        method: 'DELETE'
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'ล้างรายการสลิปไม่ผ่านเรียบร้อยแล้ว');
        setIsClearFailedOpen(false);
        fetchDonations();
      } else {
        alert(data.message || 'ลบรายการไม่สำเร็จ');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to page 1 on search or filter change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (status: 'all' | 'verified' | 'pending' | 'failed') => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const failedCount = useMemo(() => {
    return donations.filter((item) => item.status === 'failed').length;
  }, [donations]);

  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.message && item.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.transaction_ref && item.transaction_ref.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.trans_ref && item.trans_ref.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'verified' && (item.status === 'verified' || (!item.status && item.status !== 'failed' && item.status !== 'pending'))) ||
        (filterStatus === 'pending' && item.status === 'pending') ||
        (filterStatus === 'failed' && item.status === 'failed');

      return matchSearch && matchStatus;
    });
  }, [donations, searchQuery, filterStatus]);

  const totalFilteredAmount = useMemo(() => {
    return filteredDonations
      .filter((item) => item.status !== 'failed')
      .reduce((sum, item) => sum + (parseFloat(String(item.amount)) || 0), 0);
  }, [filteredDonations]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedDonations = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredDonations.slice(start, start + pageSize);
  }, [filteredDonations, validCurrentPage, pageSize]);

  const startIndex = filteredDonations.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, filteredDonations.length);

  // Generate page numbers range
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validCurrentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (validCurrentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, validCurrentPage]);

  const formatSlipRef = (raw?: string) => {
    if (!raw) return '-';
    // Strip "FAIL-xxxx | " prefix to show only Thai message
    return raw.replace(/^FAIL-[a-zA-Z0-9_-]+\s*[:|]\s*/i, '').trim() || raw;
  };

  return (
    <div className="panel">
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            ประวัติรายการโดเนททั้งหมด
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
            พบ {filteredDonations.length} จากทั้งหมด {donations.length} รายการ (ยอดเงินสมบูรณ์: ฿{totalFilteredAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn primary sm" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={14} />
            เพิ่มรายการโดเนท
          </button>

          {failedCount > 0 && (
            <button
              type="button"
              className="btn btn-danger-outline sm"
              onClick={() => setIsClearFailedOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              title="ลบรายการสลิปที่ไม่ผ่านทั้งหมดออกจากฐานข้อมูล"
            >
              <Trash2 size={14} />
              ล้างสลิปไม่ผ่าน ({failedCount})
            </button>
          )}

          <button type="button" className="btn secondary sm" onClick={fetchDonations} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'กำลังโหลด...' : 'รีเฟรชตาราง'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '10px', margin: '16px 0 20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '220px' }}>
          <input
            type="text"
            className="input-control"
            placeholder="ค้นหาชื่อ, ข้อความ หรือ Ref สลิป..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn sm ${filterStatus === 'all' ? 'primary' : 'secondary'}`}
            onClick={() => handleFilterChange('all')}
          >
            ทั้งหมด ({donations.length})
          </button>
          <button
            type="button"
            className={`btn sm ${filterStatus === 'verified' ? 'primary' : 'secondary'}`}
            onClick={() => handleFilterChange('verified')}
          >
            สำเร็จ ({donations.filter(d => d.status === 'verified' || (!d.status && d.status !== 'failed' && d.status !== 'pending')).length})
          </button>
          <button
            type="button"
            className={`btn sm ${filterStatus === 'pending' ? 'primary' : 'secondary'}`}
            onClick={() => handleFilterChange('pending')}
          >
            รอตรวจสอบ ({donations.filter(d => d.status === 'pending').length})
          </button>
          <button
            type="button"
            className={`btn sm ${filterStatus === 'failed' ? 'primary' : 'secondary'}`}
            onClick={() => handleFilterChange('failed')}
            style={filterStatus === 'failed' ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
          >
            ไม่ผ่าน ({failedCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>วัน-เวลา</th>
              <th>ชื่อผู้สนับสนุน</th>
              <th>ยอดเงิน</th>
              <th>ข้อความ</th>
              <th>ข้อมูลสลิป / Ref</th>
              <th>สถานะ</th>
              <th style={{ width: '80px', textAlign: 'center' }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} aria-hidden="true">
                  <td><Skeleton width="115px" height="15px" /></td>
                  <td><Skeleton width="130px" height="15px" /></td>
                  <td><Skeleton width="75px" height="16px" /></td>
                  <td><Skeleton width="180px" height="15px" /></td>
                  <td><Skeleton width="140px" height="14px" /></td>
                  <td><Skeleton width="65px" height="22px" radius="9999px" /></td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                      <Skeleton width="28px" height="28px" radius="6px" />
                      <Skeleton width="28px" height="28px" radius="6px" />
                    </div>
                  </td>
                </tr>
              ))
            ) : paginatedDonations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '36px' }}>
                  {searchQuery || filterStatus !== 'all' ? 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา' : 'ยังไม่มีรายการโดเนท'}
                </td>
              </tr>
            ) : (
              paginatedDonations.map((item) => (
                <tr key={item.id} style={item.status === 'failed' ? { background: 'var(--danger-soft)' } : {}}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '-'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.name || 'ไม่ระบุชื่อ'}</td>
                  <td style={{ fontWeight: 700, color: item.status === 'failed' ? 'var(--text-dim)' : 'var(--success)' }}>
                    {item.status === 'failed' ? (
                      <span style={{ textDecoration: 'line-through', opacity: 0.65 }} title="รายการนี้ไม่ผ่านการตรวจสอบ (ไม่นับรวมในยอด)">
                        ฿{(parseFloat(String(item.amount)) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      `฿${(parseFloat(String(item.amount)) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                    )}
                  </td>
                  <td style={{ maxWidth: '240px', wordBreak: 'break-word', color: 'var(--text-muted)' }}>
                    {item.message || '-'}
                  </td>
                  <td
                    style={{
                      fontSize: item.status === 'failed' ? '12px' : '11px',
                      fontFamily: item.status === 'failed' ? 'inherit' : 'monospace',
                      color: item.status === 'failed' ? 'var(--danger)' : 'var(--text-dim)',
                      maxWidth: '260px',
                      wordBreak: 'break-word',
                      lineHeight: '1.4'
                    }}
                    title={item.transaction_ref || ''}
                  >
                    {formatSlipRef(item.transaction_ref || item.trans_ref || item.slip_url)}
                  </td>
                  <td>
                    {item.status === 'failed' ? (
                      <span className="badge failed">
                        ไม่ผ่าน
                      </span>
                    ) : item.status === 'pending' ? (
                      <span className="badge pending">รอตรวจสอบ</span>
                    ) : (
                      <span className="badge verified">สำเร็จ</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-dropdown-container">
                      <button
                        type="button"
                        className={`action-dropdown-trigger ${openMenuId === item.id ? 'active' : ''}`}
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                        title="ตัวเลือกการจัดการ"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === item.id}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {openMenuId === item.id && (
                        <div className="action-dropdown-menu">
                          {item.status !== 'failed' && (
                            <button
                              type="button"
                              className="action-dropdown-item"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleReplayAlert(item);
                              }}
                            >
                              <Play size={13} style={{ color: 'var(--primary)' }} />
                              <span>เล่นซ้ำการแจ้งเตือน</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="action-dropdown-item"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleOpenEdit(item);
                            }}
                          >
                            <Edit3 size={13} style={{ color: 'var(--accent)' }} />
                            <span>แก้ไขข้อมูล</span>
                          </button>

                          <div className="action-dropdown-divider" />

                          <button
                            type="button"
                            className="action-dropdown-item danger"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleOpenDelete(item);
                            }}
                          >
                            <Trash2 size={13} />
                            <span>ลบรายการนี้</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredDonations.length > 0 && (
        <div className="pagination-wrapper">
          <div className="pagination-left">
            <div className="pagination-size-wrapper">
              <span>แสดง</span>
              <select
                className="pagination-size-select"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                aria-label="จำนวนรายการต่อหน้า"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>รายการ / หน้า</span>
            </div>

            <div className="pagination-info">
              แสดง <strong>{startIndex} - {endIndex}</strong> จาก <strong>{filteredDonations.length}</strong> รายการ (หน้า <strong>{validCurrentPage}</strong>/{totalPages})
            </div>
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage <= 1}
              title="หน้าแรก"
              aria-label="หน้าแรก"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </button>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validCurrentPage <= 1}
              title="หน้าก่อนหน้า"
              aria-label="หน้าก่อนหน้า"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                    …
                  </span>
                );
              }
              const pageNum = p as number;
              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`pagination-btn ${validCurrentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                  aria-current={validCurrentPage === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage >= totalPages}
              title="หน้าถัดไป"
              aria-label="หน้าถัดไป"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage >= totalPages}
              title="หน้าสุดท้าย"
              aria-label="หน้าสุดท้าย"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isMounted && isCreateOpen && createPortal(
        <div className="admin-layout modal-portal-root">
          <div className="modal-overlay" onClick={() => !isSubmitting && setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Plus size={18} style={{ color: 'var(--primary)' }} />
                เพิ่มรายการโดเนทด้วยตนเอง
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsCreateOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ชื่อผู้สนับสนุน *</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="เช่น ผู้สนับสนุนใจดี (เว้นว่างไว้จะใช้ 'ผู้สนับสนุนนิรนาม')"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ยอดเงิน (บาท) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    className="input-control"
                    placeholder="เช่น 50"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ข้อความโดเนท</label>
                  <textarea
                    className="input-control"
                    rows={3}
                    placeholder="ข้อความให้กำลังใจ (ไม่บังคับ)"
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    maxLength={200}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">สถานะ</label>
                    <select
                      className="input-control"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      <option value="verified">สำเร็จ (อนุมัติแล้ว)</option>
                      <option value="pending">รอตรวจสอบ (Pending)</option>
                      <option value="failed">ไม่ผ่าน (Failed)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">รหัสอ้างอิง (Ref)</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="เว้นว่างไว้เพื่อสร้างอัตโนมัติ"
                      value={formRef}
                      onChange={(e) => setFormRef(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-border)',
                  marginTop: '4px'
                }}>
                  <input
                    type="checkbox"
                    id="checkboxTriggerAlert"
                    checked={formTriggerAlert}
                    onChange={(e) => setFormTriggerAlert(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="checkboxTriggerAlert" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>
                    🔔 ยิงแจ้งเตือนขึ้นจอ OBS ทันที (Alert & TTS)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn primary sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    )}

      {/* EDIT MODAL */}
      {isMounted && isEditOpen && selectedDonation && createPortal(
        <div className="admin-layout modal-portal-root">
          <div className="modal-overlay" onClick={() => !isSubmitting && setIsEditOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit3 size={18} style={{ color: 'var(--primary)' }} />
                แก้ไขข้อมูลการโดเนท #{selectedDonation.id}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsEditOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ชื่อผู้สนับสนุน *</label>
                  <input
                    type="text"
                    className="input-control"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ยอดเงิน (บาท) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    className="input-control"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ข้อความโดเนท</label>
                  <textarea
                    className="input-control"
                    rows={3}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    maxLength={200}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">สถานะ</label>
                    <select
                      className="input-control"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      <option value="verified">สำเร็จ (อนุมัติแล้ว)</option>
                      <option value="pending">รอตรวจสอบ (Pending)</option>
                      <option value="failed">ไม่ผ่าน (Failed)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ข้อมูลสลิป / Ref</label>
                    <input
                      type="text"
                      className="input-control"
                      value={formRef}
                      onChange={(e) => setFormRef(e.target.value)}
                    />
                  </div>
                </div>

                {formStatus === 'verified' && selectedDonation.status !== 'verified' && (
                  <div className="form-group" style={{ marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={formTriggerAlert}
                        onChange={(e) => setFormTriggerAlert(e.target.checked)}
                      />
                      🔔 ส่งการแจ้งเตือนและอ่านออกเสียงขึ้นจอ OBS ทันที
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn primary sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    )}

      {/* SINGLE DELETE MODAL */}
      {isMounted && isDeleteOpen && selectedDonation && createPortal(
        <div className="admin-layout modal-portal-root">
          <div className="modal-overlay" onClick={() => !isSubmitting && setIsDeleteOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
                <AlertTriangle size={18} />
                ยืนยันการลบรายการโดเนท
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsDeleteOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.6' }}>
                คุณแน่ใจหรือไม่ว่าต้องการลบรายการของ <strong>{selectedDonation.name || 'ไม่ระบุชื่อ'}</strong> ยอด <strong>฿{(parseFloat(String(selectedDonation.amount)) || 0).toLocaleString()}</strong>?
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: 0 }}>
                ⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลจะถูกลบออกจากฐานข้อมูลอย่างถาวร
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-danger sm"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังลบ...' : 'ลบรายการนี้'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

      {/* CLEAR ALL FAILED MODAL */}
      {isMounted && isClearFailedOpen && createPortal(
        <div className="admin-layout modal-portal-root">
          <div className="modal-overlay" onClick={() => !isSubmitting && setIsClearFailedOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
                <Trash2 size={18} />
                ยืนยันล้างรายการที่ไม่ผ่านทั้งหมด
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsClearFailedOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.6' }}>
                คุณต้องการลบรายการสลิปที่ไม่ผ่านทั้งหมดจำนวน <strong>{failedCount} รายการ</strong> ออกจากฐานข้อมูลหรือไม่?
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: 0 }}>
                💡 รายการที่สำเร็จ (Verified) และ รอตรวจสอบ (Pending) จะไม่ได้รับผลกระทบ
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => setIsClearFailedOpen(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-danger sm"
                onClick={handleConfirmClearFailed}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังล้างข้อมูล...' : `ลบทั้ง ${failedCount} รายการ`}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </div>
  );
}
