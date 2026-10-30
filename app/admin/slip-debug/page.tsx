'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileSearch,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Trash2,
  Sliders,
  ShieldCheck,
  Coins,
  Building,
  UserCheck,
  Code2
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import './slip-debug.css';

interface SlipDebugConfig {
  isConfigured: boolean;
  branchIdMasked: string;
  hasApiKey: boolean;
  receiverName: string;
  receiverAccount: string;
  promptpayId: string;
}

interface DiagnosticResult {
  isSuccess: boolean;
  httpStatus: number;
  errorCode: number | null;
  errorMessage: string | null;
  dryRun: boolean;
  transRef: string | null;
  duplicateCheck: {
    isDuplicate: boolean;
    existingDonationId: any;
    existingCreatedAt: string | null;
  };
  amountCheck: {
    expected: number | null;
    slipAmount: number | null;
    matches: boolean;
  };
  receiverCheck: {
    configuredName: string;
    configuredAccount: string;
    configuredPromptpay: string;
    slipReceiverName: string | null;
    slipReceiverAccount: string | null;
    nameMatches: boolean;
    accountMatches: boolean;
  };
}

export default function SlipDebugPage() {
  const { showToast, handleUnauthorized } = useAdmin();

  // Status & Quota State
  const [config, setConfig] = useState<SlipDebugConfig | null>(null);
  const [quota, setQuota] = useState<any>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expectedAmount, setExpectedAmount] = useState<string>('');
  const [dryRun, setDryRun] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Result State
  const [result, setResult] = useState<{
    diagnostics: DiagnosticResult;
    rawResponse: any;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadStatus = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/admin/slip-debug');
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setQuota(data.quota);
        setQuotaError(data.quotaError);
      } else {
        showToast('โหลดสถานะ SlipOK ไม่สำเร็จ: ' + data.message);
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [handleUnauthorized]);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      showToast('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP เท่านั้น');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResult(null);
  };

  const handleClearFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('กรุณาเลือกหรืออัปโหลดสลิปก่อน');
      return;
    }

    setVerifying(true);
    try {
      const formData = new FormData();
      formData.append('slip', file);
      if (expectedAmount.trim()) {
        formData.append('expectedAmount', expectedAmount.trim());
      }
      formData.append('dryRun', dryRun ? 'true' : 'false');

      const res = await fetch('/api/admin/slip-debug', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (data.success && data.diagnostics) {
        setResult({
          diagnostics: data.diagnostics,
          rawResponse: data.rawResponse
        });
        if (data.diagnostics.isSuccess) {
          showToast('สลิปถูกต้องผ่านการตรวจสอบ!');
        } else {
          showToast('การตรวจสอบไม่ผ่าน: ' + (data.diagnostics.errorMessage || 'พบข้อผิดพลาด'));
        }
      } else {
        showToast('เกิดข้อผิดพลาด: ' + (data.message || 'Error'));
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyJson = () => {
    if (!result?.rawResponse) return;
    navigator.clipboard.writeText(JSON.stringify(result.rawResponse, null, 2));
    setCopied(true);
    showToast('คัดลอก Raw JSON เรียบร้อยแล้ว');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="slip-debug-container">
      {/* Top Header */}
      <div className="slip-debug-header">
        <div className="slip-debug-title-area">
          <div className="slip-debug-icon">
            <FileSearch size={24} />
          </div>
          <div>
            <h1 className="slip-debug-title">ทดสอบและวิเคราะห์สลิป (Slip Debug)</h1>
            <p className="slip-debug-subtitle">
              ตรวจสอบสลิปการโอนเงินสดผ่าน SlipOK API พร้อมดูผลการตรวจกฎและ Raw JSON เต็มรูปแบบ
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {quota?.data?.quota !== undefined && (
            <div className="quota-badge">
              <Coins size={15} />
              โควต้าคงเหลือ: {Number(quota.data.quota).toLocaleString('th-TH')} สลิป
            </div>
          )}

          <button
            type="button"
            className="btn secondary sm"
            onClick={() => void loadStatus()}
            disabled={loadingConfig}
            title="รีเฟรชโควต้า"
          >
            <RefreshCw className={loadingConfig ? 'animate-spin' : ''} size={14} />
            รีเฟรชสถานะ
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="slip-debug-grid">
        {/* Left Column: Upload & Parameters */}
        <div className="slip-debug-col-left">
          {/* Card: Upload Slip */}
          <div className="slip-debug-card">
            <div className="slip-debug-card-header">
              <span className="slip-debug-card-title">
                <UploadCloud size={18} color="var(--primary, #7C3AED)" />
                อัปโหลดรูปภาพสลิป
              </span>
              {file && (
                <button
                  type="button"
                  className="btn danger sm"
                  onClick={handleClearFile}
                >
                  <Trash2 size={13} />
                  ล้างไฟล์
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />

            {previewUrl ? (
              <div className="slip-preview-container">
                <img src={previewUrl} alt="Slip preview" className="slip-preview-img" />
                <button
                  type="button"
                  className="slip-preview-remove"
                  onClick={handleClearFile}
                  title="ลบรูป"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div
                className="slip-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={40} color="var(--primary, #7C3AED)" style={{ opacity: 0.8 }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                    คลิกเพื่อเลือกไฟล์ หรือ ลากรูปสลิปมาวางที่นี่
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    รองรับ JPG, PNG, WEBP (สูงสุด 4 MB)
                  </p>
                </div>
              </div>
            )}

            {/* Test Parameters */}
            <div className="slip-input-group">
              <label className="slip-input-label">ยอดเงินที่คาดหวัง (Expected Amount - ไม่บังคับ)</label>
              <input
                type="number"
                step="0.01"
                className="slip-input-field"
                placeholder="เช่น 100 หรือปล่อยว่างถ้าต้องการเช็คเฉพาะยอดในสลิป"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
              />
            </div>

            {/* Dry Run Toggle */}
            <div className="slip-toggle-box">
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                  โหมด Dry Run (ไม่บันทึกซ้ำใน SlipOK)
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ส่ง `log=false` ช่วยให้สามารถทดสอบสลิปใบเดิมซ้ำๆ ได้โดยไม่ติด Error สลิปซ้ำ
                </span>
              </div>
              <label className="val-switch" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={() => setDryRun(!dryRun)}
                />
                <span className="val-slider" />
              </label>
            </div>

            <button
              type="button"
              className="btn"
              style={{ width: '100%', marginTop: '20px', padding: '12px' }}
              onClick={handleVerify}
              disabled={verifying || !file}
            >
              {verifying ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  กำลังตรวจสอบสลิปผ่าน SlipOK API...
                </>
              ) : (
                <>
                  <FileSearch size={16} />
                  ส่งตรวจสอบสลิป (Debug Verify)
                </>
              )}
            </button>
          </div>

          {/* Config Information Card */}
          <div className="slip-debug-card">
            <div className="slip-debug-card-header">
              <span className="slip-debug-card-title">
                <Building size={18} color="var(--text-dim, #687185)" />
                ข้อมูลบัญชีที่ตั้งไว้ในระบบ
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Branch ID:</span>
                <span style={{ fontWeight: 600 }}>{config?.branchIdMasked || 'ยังไม่ตั้งค่า'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ชื่อบัญชีผู้รับ:</span>
                <span style={{ fontWeight: 600 }}>{config?.receiverName || 'ยังไม่ตั้งค่า'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>เลขบัญชีธนาคาร:</span>
                <span style={{ fontWeight: 600 }}>{config?.receiverAccount || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>พร้อมเพย์ (PromptPay):</span>
                <span style={{ fontWeight: 600 }}>{config?.promptpayId || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Analysis & Raw JSON */}
        <div className="slip-debug-col-right">
          {result ? (
            <>
              {/* Overall Status Banner */}
              <div
                className={`diag-card ${result.diagnostics.isSuccess ? 'pass' : 'fail'}`}
                style={{ marginBottom: '20px' }}
              >
                <div className="diag-icon">
                  {result.diagnostics.isSuccess ? (
                    <CheckCircle2 size={24} color="var(--success, #167650)" />
                  ) : (
                    <XCircle size={24} color="var(--danger, #B42345)" />
                  )}
                </div>
                <div className="diag-content">
                  <div className="diag-title" style={{ fontSize: '16px' }}>
                    {result.diagnostics.isSuccess
                      ? 'สลิปถูกต้องสมบูรณ์ (HTTP 200 - Success)'
                      : `การตรวจสอบล้มเหลว (${result.diagnostics.errorCode ? `Code ${result.diagnostics.errorCode} - ` : ''}${result.diagnostics.errorMessage || 'Invalid'})`}
                  </div>
                  <div className="diag-desc">
                    {result.diagnostics.isSuccess ? (
                      <>
                        รหัสอ้างอิง: <strong>{result.diagnostics.transRef}</strong> | ยอดเงิน:{' '}
                        <strong>฿{result.diagnostics.amountCheck.slipAmount}</strong>
                      </>
                    ) : (
                      result.diagnostics.errorMessage
                    )}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Rule Analysis */}
              <div className="slip-debug-card">
                <div className="slip-debug-card-header">
                  <span className="slip-debug-card-title">
                    <ShieldCheck size={18} color="var(--primary, #7C3AED)" />
                    ผลการวิเคราะห์กฎของระบบ (System Rule Diagnostics)
                  </span>
                </div>

                {/* Rule 1: Duplicate Check */}
                <div
                  className={`diag-card ${!result.diagnostics.duplicateCheck.isDuplicate ? 'pass' : 'fail'}`}
                >
                  <div className="diag-icon">
                    {!result.diagnostics.duplicateCheck.isDuplicate ? (
                      <CheckCircle2 size={18} color="var(--success)" />
                    ) : (
                      <XCircle size={18} color="var(--danger)" />
                    )}
                  </div>
                  <div className="diag-content">
                    <div className="diag-title">1. ตรวจสอบสลิปซ้ำ (Duplicate Check in DB)</div>
                    <div className="diag-desc">
                      {!result.diagnostics.duplicateCheck.isDuplicate
                        ? 'ไม่พบประวัติการใช้งานสลิปนี้ในฐานข้อมูล (สลิปใหม่ใช้งานได้)'
                        : `สลิปนี้เคยถูกใช้ไปแล้วในระบบ (Donation ID: ${result.diagnostics.duplicateCheck.existingDonationId} เมื่อ ${new Date(result.diagnostics.duplicateCheck.existingCreatedAt || '').toLocaleString('th-TH')})`}
                    </div>
                  </div>
                </div>

                {/* Rule 2: Amount Match */}
                <div className={`diag-card ${result.diagnostics.amountCheck.matches ? 'pass' : 'fail'}`}>
                  <div className="diag-icon">
                    {result.diagnostics.amountCheck.matches ? (
                      <CheckCircle2 size={18} color="var(--success)" />
                    ) : (
                      <XCircle size={18} color="var(--danger)" />
                    )}
                  </div>
                  <div className="diag-content">
                    <div className="diag-title">2. ตรวจสอบยอดเงิน (Amount Match)</div>
                    <div className="diag-desc">
                      ยอดในสลิป:{' '}
                      <strong>
                        {result.diagnostics.amountCheck.slipAmount !== null
                          ? `฿${result.diagnostics.amountCheck.slipAmount}`
                          : 'ไม่พบ'}
                      </strong>
                      {result.diagnostics.amountCheck.expected !== null && (
                        <>
                          {' '}
                          | ยอดที่คาดหวัง:{' '}
                          <strong>฿{result.diagnostics.amountCheck.expected}</strong>
                        </>
                      )}
                      {result.diagnostics.amountCheck.matches ? ' (ตรงกัน)' : ' (ยอดไม่ตรงกัน!)'}
                    </div>
                  </div>
                </div>

                {/* Rule 3: Receiver Name & Account */}
                <div
                  className={`diag-card ${result.diagnostics.receiverCheck.nameMatches && result.diagnostics.receiverCheck.accountMatches ? 'pass' : 'fail'}`}
                >
                  <div className="diag-icon">
                    {result.diagnostics.receiverCheck.nameMatches &&
                    result.diagnostics.receiverCheck.accountMatches ? (
                      <CheckCircle2 size={18} color="var(--success)" />
                    ) : (
                      <AlertCircle size={18} color="var(--warning, #A65C1D)" />
                    )}
                  </div>
                  <div className="diag-content">
                    <div className="diag-title">3. ตรวจสอบผู้รับเงิน (Receiver Verification)</div>
                    <div className="diag-desc">
                      <div>
                        ชื่อผู้รับในสลิป:{' '}
                        <strong>
                          {result.diagnostics.receiverCheck.slipReceiverName || 'ไม่มีข้อมูล'}
                        </strong>{' '}
                        {result.diagnostics.receiverCheck.nameMatches ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ ชื่อตรงกับระบบ</span>
                        ) : (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>✗ ชื่อไม่ตรง</span>
                        )}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        บัญชี/พร้อมเพย์ในสลิป:{' '}
                        <strong>
                          {result.diagnostics.receiverCheck.slipReceiverAccount || 'ไม่มีข้อมูล'}
                        </strong>{' '}
                        {result.diagnostics.receiverCheck.accountMatches ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ บัญชีตรง</span>
                        ) : (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>✗ ไม่ตรงกับบัญชีร้าน</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON Viewer */}
              <div className="slip-debug-card">
                <div className="slip-debug-card-header">
                  <span className="slip-debug-card-title">
                    <Code2 size={18} color="var(--primary, #7C3AED)" />
                    SlipOK Raw JSON Response
                  </span>
                  <button type="button" className="json-btn-copy" onClick={handleCopyJson}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}
                  </button>
                </div>

                <div className="json-viewer-box">
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(result.rawResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div
              className="slip-debug-card"
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <FileSearch size={48} color="var(--border, #cbd5e1)" />
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>
                ยังไม่มีข้อมูลการทดสอบ
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px' }}>
                อัปโหลดรูปภาพสลิปที่กล่องด้านซ้าย แล้วกดปุ่ม &quot;ส่งตรวจสอบสลิป&quot; เพื่อดูผลการจับคู่และ Raw
                JSON Response จาก SlipOK
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

