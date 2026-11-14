'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight, Copy, Download,
  Check, CheckCheck, CircleHelp, ExternalLink,
  LoaderCircle,
  Moon, PlayCircle, ShieldCheck, Sun, UploadCloud,
  X,
} from 'lucide-react';
import { validateDonation, validateSlip, type DonationErrors, type PaymentMethod } from '@/lib/donation-form';
import { containsProfanity } from '@/lib/profanity';
import { createDonationQr, redeemDonation, verifyDonation } from '@/lib/donation-client';
import { readDonationTheme, saveDonationTheme, type DonationTheme } from '@/lib/donation-theme';
import {
  DEFAULT_MEDIA_SHARE_MAX_DURATION,
  DEFAULT_MEDIA_SHARE_MIN_AMOUNT,
  getMediaShareConfig,
  parseYouTubeUrl,
} from '@/lib/media-share';
import { getDonatePageProfile, type DonatePageProfile } from '@/lib/donate-page-profile';
import { SocialPlatformIcon } from '@/app/components/SocialPlatformIcon';
import { useDonationWidgets } from '@/lib/useDonationWidgets';
import type { PromptPayResult } from '@/lib/services/promptpay';
import styles from './donation.module.css';

const INITIAL_AMOUNT = 5;
const moneyFormatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });
const AMOUNTS = [5, 10, 20, 50, 100, 500];
const METHODS = [
  { id: 'promptpay' as const, name: 'PromptPay', logo: '/payments/promptpay.png' },
  { id: 'truemoney' as const, name: 'TrueMoney', logo: 'https://f.ptcdn.info/035/054/000/oxg367902Xyvy63Fxjv-o.png' },
];
const DONATION_GUIDES: Record<PaymentMethod, { title: string; description: string }[]> = {
  promptpay: [
    { title: 'กรอกข้อมูลและเลือกยอด', description: 'ใส่ชื่อ ข้อความถ้ามี แล้วกด “สร้าง QR พร้อมเพย์”' },
    { title: 'โอนผ่าน QR', description: 'สแกนหรือบันทึก QR ไปเปิดในแอปธนาคาร ตรวจสอบผู้รับและยอดก่อนโอน' },
    { title: 'แนบสลิป', description: 'กลับมาแนบสลิป กด “ยืนยันสลิป” แล้วรอผลตรวจสอบ' },
  ],
  truemoney: [
    { title: 'กรอกข้อมูล', description: 'ใส่ชื่อ ข้อความถ้ามี แล้วเลือก TrueMoney' },
    { title: 'สร้างซองของขวัญ', description: 'สร้างซองในแอป TrueMoney แล้วคัดลอกลิงก์' },
    { title: 'ยืนยันซอง', description: 'วางลิงก์ กด “ยืนยันซองของขวัญ” แล้วรอผล ยอดโดเนทจะเท่ากับเงินที่รับได้จริง' },
  ],
};
const INFO = {
  help: { title: 'วิธีโดเนท', text: 'ใส่ชื่อและข้อความ แล้วเลือก PromptPay เพื่อสร้าง QR โอนเงิน และแนบสลิปยืนยัน หรือเลือก TrueMoney Wallet แล้ววางลิงก์ซองของขวัญ ระบบจะแสดงยอดตามมูลค่าซองที่รับได้จริง เมื่อยืนยันสำเร็จ ระบบจะบันทึกโดเนทและส่งแจ้งเตือนไปยังสตรีม' },
  privacy: { title: 'ข้อมูลที่ใช้ทำรายการ', text: 'ชื่อ ข้อความ และข้อมูลรายการจะถูกส่งไปยังระบบเพื่อบันทึกโดเนท สลิปจะถูกส่งไปตรวจสอบกับผู้ให้บริการตรวจสลิป ลิงก์ซองจะถูกส่งไปรับเงินผ่านบริการ TrueMoney ชื่อและข้อความที่สนับสนุนอาจแสดงบนสตรีม' },
  terms: { title: 'เงื่อนไขการสนับสนุน', text: 'ตรวจสอบจำนวนเงินและผู้รับก่อนโอนเงิน ใช้สลิปหรือลิงก์ซองของขวัญของคุณเองเท่านั้น หากโอนเงินแล้วหรือซองถูกรับแล้วแต่ยังไม่แสดงผลสำเร็จ กรุณาติดต่อผู้ดูแลพร้อมหลักฐานก่อนทำรายการซ้ำ' },
};

type Receipt = { name: string; amount: string; message: string; method: string; reference: string; mediaUrl?: string };

export default function DonatePageClient({ initialProfile }: { initialProfile: DonatePageProfile }) {
  const [theme, setTheme] = useState<DonationTheme>();
  const themePreference = useRef<DonationTheme | null>(null);
  const [profile, setProfile] = useState<DonatePageProfile>(initialProfile);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(String(INITIAL_AMOUNT));
  const [method, setMethod] = useState<PaymentMethod>('promptpay');
  const [guideMethod, setGuideMethod] = useState<PaymentMethod | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<DonationErrors>({});
  const [busy, setBusy] = useState(false);
  const [voucher, setVoucher] = useState('');
  const [qrData, setQrData] = useState<PromptPayResult | null>(null);
  const [minAmount, setMinAmount] = useState(INITIAL_AMOUNT);
  const [avatarError, setAvatarError] = useState(false);
  const [heroError, setHeroError] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [customBlacklist, setCustomBlacklist] = useState<string[]>([]);
  const [mediaEnabled, setMediaEnabled] = useState(false);
  const [mediaMinAmount, setMediaMinAmount] = useState(DEFAULT_MEDIA_SHARE_MIN_AMOUNT);
  const [mediaMaxDuration, setMediaMaxDuration] = useState(DEFAULT_MEDIA_SHARE_MAX_DURATION);
  const [attachMedia, setAttachMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{
    videoId: string;
    title: string;
    authorName: string;
    thumbnailUrl: string;
    startSeconds: number;
  } | null>(null);
  const [mediaPreviewLoading, setMediaPreviewLoading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [statsRevision, setStatsRevision] = useState(0);
  const { data: widgets, error: widgetsError, retry: retryWidgets } = useDonationWidgets(statsRevision);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [info, setInfo] = useState<keyof typeof INFO>('help');
  const fileInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const qrHeading = useRef<HTMLHeadingElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const infoDialog = useRef<HTMLDialogElement>(null);
  const currentMethod = METHODS.find((item) => item.id === method)!;
  const visibleGuide = guideMethod ?? method;
  const goalPercent = widgets ? widgets.goal.current / widgets.goal.target * 100 : 0;
  const displayAmount = Number.isFinite(Number(amount)) && Number(amount) > 0
    ? Number(amount).toLocaleString('th-TH', { maximumFractionDigits: 2 }) : '0';
  const parsedMedia = mediaEnabled && attachMedia ? parseYouTubeUrl(mediaUrl) : null;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    themePreference.current = readDonationTheme();
    const syncTheme = () => setTheme(themePreference.current ?? (media.matches ? 'dark' : 'light'));
    syncTheme();
    media.addEventListener('change', syncTheme);
    return () => media.removeEventListener('change', syncTheme);
  }, []);

  function toggleTheme() {
    const current = theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    themePreference.current = next;
    setTheme(next);
    saveDonationTheme(next);
  }

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => { setAvatarError(false); }, [profile.avatarUrl]);
  useEffect(() => { setHeroError(false); }, [profile.heroUrl]);
  useEffect(() => { if (receipt) successHeading.current?.focus(); }, [receipt]);
  useEffect(() => { if (qrData) qrHeading.current?.focus(); }, [qrData]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/settings', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Settings unavailable');
        return response.json();
      })
      .then((data) => {
        if (!data.success) throw new Error('Settings unavailable');
        const minimum = Number(data.settings?.min_donate);
        if (Number.isFinite(minimum) && minimum > 0) setMinAmount(Math.max(INITIAL_AMOUNT, minimum));
        setReceiverName(data.settings?.receiver_name || '');
        if (Array.isArray(data.blacklist)) setCustomBlacklist(data.blacklist);
        const mediaCfg = getMediaShareConfig(data.settings);
        setMediaEnabled(mediaCfg.enabled);
        setMediaMinAmount(mediaCfg.minAmount);
        setMediaMaxDuration(mediaCfg.maxDuration);
        if (data.settings && Object.keys(data.settings).some((k) => k.startsWith('donate_page_'))) {
          setProfile(getDonatePageProfile(data.settings));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setToast({ text: 'โหลดข้อมูลยอดขั้นต่ำไม่สำเร็จ ระบบจะตรวจสอบยอดอีกครั้งตอนยืนยัน', error: true });
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!parsedMedia) {
      setMediaPreview(null);
      setMediaPreviewLoading(false);
      return;
    }
    const controller = new AbortController();
    setMediaPreviewLoading(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/media/youtube-info?url=${encodeURIComponent(parsedMedia.canonicalUrl)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.data) {
            setMediaPreview(data.data);
          } else {
            setMediaPreview({
              videoId: parsedMedia.videoId,
              title: `YouTube (${parsedMedia.videoId})`,
              authorName: 'YouTube',
              thumbnailUrl: parsedMedia.thumbnailUrl,
              startSeconds: parsedMedia.startSeconds,
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setMediaPreviewLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [parsedMedia?.canonicalUrl]);

  function toggleAttachMedia() {
    setAttachMedia((prev) => {
      const next = !prev;
      if (!next) {
        setMediaUrl('');
        setMediaPreview(null);
        setErrors((e) => ({ ...e, mediaUrl: undefined, amount: undefined }));
      } else {
        setQrData(null);
        removeFile();
      }
      return next;
    });
  }

  function clearError(field: keyof DonationErrors) {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function handleNameChange(val: string) {
    setName(val);
    if (containsProfanity(val, customBlacklist)) {
      setErrors((prev) => ({ ...prev, name: 'ชื่อมีคำไม่สุภาพหรือไม่เหมาะสม' }));
    } else {
      clearError('name');
    }
  }

  function handleMessageChange(val: string) {
    setMessage(val);
    if (containsProfanity(val, customBlacklist)) {
      setErrors((prev) => ({ ...prev, message: 'ข้อความมีคำไม่สุภาพหรือไม่เหมาะสม' }));
    } else {
      clearError('message');
    }
  }

  function removeFile() {
    setFile(null);
    if (fileInput.current) fileInput.current.value = '';
    clearError('slip');
  }

  function selectFile(selected?: File) {
    if (!selected || busy) return;
    const error = validateSlip(selected);
    if (error) {
      setErrors((previous) => ({ ...previous, slip: error }));
      setToast({ text: error, error: true });
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    setFile(selected);
    clearError('slip');
    setToast({ text: 'แนบสลิปแล้ว กดยืนยันเพื่อตรวจสอบรายการ' });
  }

  function changeAmount(value: string) {
    setAmount(value);
    setQrData(null);
    removeFile();
    clearError('amount');
  }

  function changeMethod(value: PaymentMethod) {
    if (value === method) return;
    setMethod(value);
    setGuideMethod(null);
    setQrData(null);
    removeFile();
    setVoucher('');
    setErrors({});
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors = validateDonation({
      name,
      message,
      amount,
      method,
      hasSlip: !!file,
      requireSlip: !!qrData,
      minAmount,
      voucher,
      customBlacklist,
      mediaEnabled,
      attachMedia,
      mediaUrl,
      mediaMinAmount,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.name === 'ชื่อมีคำไม่สุภาพหรือไม่เหมาะสม' || nextErrors.message === 'ข้อความมีคำไม่สุภาพหรือไม่เหมาะสม') {
        setToast({ text: 'พบคำไม่สุภาพหรือไม่เหมาะสม กรุณาแก้ไขก่อนทำรายการ', error: true });
      } else {
        setToast({ text: 'กรุณาตรวจสอบข้อมูลที่ไฮไลต์ไว้', error: true });
      }
      const firstField = Object.keys(nextErrors)[0];
      document.getElementById(`donation-${firstField}`)?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setToast(null);
    const submittedMediaUrl = mediaEnabled && attachMedia && parsedMedia ? parsedMedia.canonicalUrl : undefined;
    try {
      if (method === 'promptpay' && !qrData) {
        setQrData(await createDonationQr(Number(amount)));
        setToast({ text: 'สร้าง QR แล้ว ตรวจสอบผู้รับ โอนเงิน และแนบสลิปด้านล่าง' });
        return;
      }
      const donation = method === 'truemoney'
        ? await redeemDonation({ name, message, voucher, mediaUrl: submittedMediaUrl })
        : await verifyDonation({ name, message, amount: String(qrData!.amount), slip: file!, mediaUrl: submittedMediaUrl });
      setReceipt({
        name: donation.name, amount: donation.amount.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
        message: donation.message || '', method: currentMethod.name,
        reference: donation.transaction_ref || donation.trans_ref || String(donation.id),
        mediaUrl: donation.media_url || undefined,
      });
      setToast({ text: 'โดเนทสำเร็จ' });
      setStatsRevision((revision) => revision + 1);
    } catch (error) {
      setToast({ text: error instanceof Error && !(error instanceof TypeError) ? error.message : 'ไม่สามารถยืนยันผลรายการได้ กรุณาตรวจสอบสถานะก่อนทำรายการซ้ำ', error: true });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function reset() {
    setReceipt(null);
    setName('');
    setMessage('');
    setAttachMedia(false);
    setMediaUrl('');
    setMediaPreview(null);
    setAmount(String(Math.max(INITIAL_AMOUNT, minAmount)));
    setMethod('promptpay');
    setGuideMethod(null);
    setVoucher('');
    setQrData(null);
    removeFile();
    setErrors({});
  }

  async function copyPromptPay() {
    if (!qrData) return;
    try {
      await navigator.clipboard.writeText(qrData.promptpayId);
      setToast({ text: 'คัดลอกหมายเลขพร้อมเพย์แล้ว' });
    } catch {
      setToast({ text: 'คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกหมายเลขที่แสดงด้วยตนเอง', error: true });
    }
  }

  async function saveQrImage() {
    if (!qrData) return;
    const dataUrl = qrData.qrImage || qrData.qrDataUrl;
    if (!dataUrl) return;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const filename = `promptpay-${qrData.amount}thb.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `PromptPay QR ฿${qrData.amount}`,
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      setToast({ text: 'บันทึกรูป QR เรียบร้อยแล้ว' });
    } catch {
      setToast({
        text: 'ไม่สามารถบันทึกรูปอัตโนมัติได้ กรุณากดค้างที่รูป QR เพื่อบันทึกภาพ',
        error: true,
      });
    }
  }

  function openInfo(key: keyof typeof INFO) {
    setInfo(key);
    infoDialog.current?.showModal();
  }

  return (
    <div className={styles.page} data-theme={theme}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.hero}>
        {profile.heroUrl && !heroError && (
          <img
            className={styles.heroImage}
            src={profile.heroUrl}
            alt=""
            loading="eager"
            fetchPriority="high"
            referrerPolicy="no-referrer"
            onError={() => setHeroError(true)}
          />
        )}
        <div className={styles.heroControls}>
          <button type="button" className={styles.themeToggle} onClick={toggleTheme} aria-label="โหมดมืด" aria-pressed={theme === undefined ? undefined : theme === 'dark'} title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}>
            <Sun size={16} className={styles.sunIcon} />
            <Moon size={16} className={styles.moonIcon} />
            <span className={styles.themeTrack}><span /></span>
          </button>
          <button className={styles.helpButton} onClick={() => openInfo('help')}><CircleHelp size={17} /><span>ช่วยเหลือ</span></button>
        </div>
      </div>

      <main className={styles.main}>
        <section className={styles.story} aria-labelledby="support-heading">
          <div className={styles.profile}>
            <div className={styles.profileBody}>
              <div className={styles.avatar}>
                {!avatarError ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`รูปโปรไฟล์ ${profile.name}`}
                    width={88}
                    height={88}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className={styles.avatarFallback} aria-label={profile.name}>
                    {(profile.name.trim()[0] || 'S').toUpperCase()}
                  </span>
                )}
              </div>
              <h1 id="support-heading">{profile.name}</h1>
              {profile.handle && <p className={styles.profileHandle}>{profile.handle}</p>}
              {profile.bio && <p className={styles.profileBio}>{profile.bio}</p>}
              {profile.socialLinks.length > 0 && (
                <div className={styles.socialLinks} aria-label="ช่องทางโซเชียล">
                  {profile.socialLinks.map((item) => (
                    <a
                      key={item.key}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLinkBtn}
                      aria-label={item.label}
                      title={item.label}
                    >
                      <SocialPlatformIcon platform={item.platform} size={16} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.statsCard}>
            <section className={styles.goalSection} aria-labelledby="donation-goal-heading" aria-busy={!widgets && !widgetsError}>
              <h2 id="donation-goal-heading">{widgets?.goal.title || 'เป้าหมายโดเนท'}</h2>
              {widgets ? <>
                <div className={styles.goalAmounts}><strong>฿{moneyFormatter.format(widgets.goal.current)}</strong><span>/ ฿{moneyFormatter.format(widgets.goal.target)}</span></div>
                <div className={styles.goalTrack} role="progressbar" aria-label={widgets.goal.title} aria-valuemin={0} aria-valuemax={widgets.goal.target} aria-valuenow={Math.min(widgets.goal.current, widgets.goal.target)} aria-valuetext={`${moneyFormatter.format(widgets.goal.current)} จาก ${moneyFormatter.format(widgets.goal.target)} บาท`}><span style={{ width: `${Math.min(100, goalPercent)}%` }} /></div>
                <p className={styles.goalPercent}>{moneyFormatter.format(goalPercent)}%</p>
              </> : <p className={styles.statsMessage}>{widgetsError ? 'โหลดเป้าหมายไม่สำเร็จ' : 'กำลังโหลดเป้าหมาย…'}</p>}
              {widgetsError && <div className={styles.statsError}><span>{widgets ? 'อัปเดตข้อมูลไม่สำเร็จ' : 'กรุณาลองอีกครั้ง'}</span><button type="button" onClick={retryWidgets}>ลองใหม่</button></div>}
            </section>

            <section className={styles.rankingSection} aria-labelledby="donation-ranking-heading" aria-busy={!widgets && !widgetsError}>
              <h2 id="donation-ranking-heading">อันดับโดเนทสะสม</h2>
              {widgets ? widgets.allTime.length > 0 ? <>
                <ol className={styles.rankingList} role="list">
                  {widgets.allTime.slice(0, 3).map((donor, index) => <li key={donor.name}><span className={styles.donorRank} aria-label={`อันดับ ${index + 1}`}>{index + 1}</span><span className={styles.donorName} title={donor.name}>{donor.name}</span><strong>฿{moneyFormatter.format(donor.amount)}</strong></li>)}
                </ol>
                <p className={styles.statsFootnote}>รวมยอดตามชื่อผู้โดเนท · สะสมทั้งหมด</p>
              </> : <p className={styles.statsMessage}>ยังไม่มีรายการโดเนท</p> : <p className={styles.statsMessage}>{widgetsError ? 'โหลดอันดับไม่สำเร็จ' : 'กำลังโหลดอันดับ…'}</p>}
            </section>
          </div>

          <section className={styles.guideCard} aria-labelledby="donation-guide-heading">
            <div className={styles.guideHeader}>
              <h2 id="donation-guide-heading">วิธีโดเนท</h2>
            </div>
            <div id="donation-guide-content" className={styles.guideContent}>
              <div className={styles.guideMethods} role="group" aria-label="เลือกอ่านวิธีโดเนทตามช่องทาง">
                {METHODS.map(({ id, name: label }) => <button type="button" key={id} aria-label={`วิธีโดเนทผ่าน ${label}`} aria-pressed={visibleGuide === id} onClick={() => setGuideMethod(id)}>{label}</button>)}
              </div>
              <ol className={styles.guideSteps} role="list">
                {DONATION_GUIDES[visibleGuide].map(({ title, description }, index) => <li key={`${visibleGuide}-${index}`}><span className={styles.guideNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h4>{title}</h4><p>{description}</p></div></li>)}
              </ol>
            </div>
          </section>
        </section>

        <section className={styles.formCard} aria-labelledby="form-heading">
          <div className={styles.cardHeader}><h2 id="form-heading">โดเนทให้ {profile.name}</h2></div>
          {receipt ? (
            <div className={styles.success}>
              <div className={styles.successIcon}><CheckCheck size={38} /></div>
              <h3 ref={successHeading} tabIndex={-1}>โดเนทสำเร็จ</h3>
              <p>จาก <strong>{receipt.name}</strong> ถึง {profile.name}</p>
              <div className={styles.successAmount}>฿{receipt.amount}</div>
              {receipt.message && <blockquote>“{receipt.message}”</blockquote>}
              <div className={styles.receiptRow}><span>ช่องทางที่เลือก</span><strong>{receipt.method}</strong></div>
              <div className={styles.receiptRow}><span>เลขอ้างอิง</span><strong className={styles.reference}>{receipt.reference}</strong></div>
              {receipt.mediaUrl && (
                <div className={styles.receiptRow}>
                  <span>ลิงก์คลิปที่แนบ</span>
                  <a className={styles.receiptLink} href={receipt.mediaUrl} target="_blank" rel="noopener noreferrer">
                    เปิดคลิป YouTube <ExternalLink size={13} />
                  </a>
                </div>
              )}
              <button type="button" className={styles.submitButton} onClick={reset}>โดเนทอีกครั้ง</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate aria-busy={busy}>
              <fieldset className={styles.fields} disabled={busy}>
                <div className={styles.formSection}>
                  <label className={styles.label} htmlFor="donation-name">ชื่อ <span>*</span></label>
                  <input
                    id="donation-name"
                    className={`${styles.input} ${errors.name ? styles.invalid : ''}`}
                    placeholder="ชื่อที่ต้องการแสดงบนสตรีม"
                    maxLength={50}
                    value={name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    onBlur={() => {
                      if (containsProfanity(name, customBlacklist)) {
                        setErrors((prev) => ({ ...prev, name: 'ชื่อมีคำไม่สุภาพหรือไม่เหมาะสม' }));
                      }
                    }}
                    autoComplete="nickname"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && <p className={styles.error} id="name-error">{errors.name}</p>}
                  <div className={styles.labelRow}><label className={styles.label} htmlFor="donation-message">ข้อความ <span className={styles.optional}>(ไม่บังคับ)</span></label><span>{message.length}/200</span></div>
                  <textarea
                    id="donation-message"
                    className={`${styles.textarea} ${errors.message ? styles.invalid : ''}`}
                    placeholder="เขียนข้อความถึงสตรีมเมอร์"
                    maxLength={200}
                    value={message}
                    onChange={(event) => handleMessageChange(event.target.value)}
                    onBlur={() => {
                      if (containsProfanity(message, customBlacklist)) {
                        setErrors((prev) => ({ ...prev, message: 'ข้อความมีคำไม่สุภาพหรือไม่เหมาะสม' }));
                      }
                    }}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                  />
                  {errors.message && <p className={styles.error} id="message-error">{errors.message}</p>}
                  {mediaEnabled && (
                    <div className={styles.mediaBox}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={attachMedia}
                        className={`${styles.mediaToggle} ${attachMedia ? styles.mediaToggleActive : ''}`}
                        onClick={toggleAttachMedia}
                      >
                        <span className={styles.mediaToggleIcon}><PlayCircle size={18} /></span>
                        <span className={styles.mediaToggleText}>
                          <strong>แนบลิงก์คลิป / เพลง YouTube <span className={styles.optional}>(ไม่บังคับ)</span></strong>
                          <small>เล่นบนจอสตรีมหลังแจ้งเตือน · ขั้นต่ำ ฿{moneyFormatter.format(mediaMinAmount)} · สูงสุด {mediaMaxDuration} วิ</small>
                        </span>
                        <span className={styles.mediaSwitch} aria-hidden="true"><span /></span>
                      </button>

                      {attachMedia && (
                        <div className={styles.mediaDrawer}>
                          <div className={styles.mediaInputWrap}>
                            <input
                              id="donation-mediaUrl"
                              type="url"
                              inputMode="url"
                              autoComplete="off"
                              spellCheck={false}
                              className={`${styles.input} ${styles.mediaInput} ${errors.mediaUrl ? styles.invalid : ''}`}
                              placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                              value={mediaUrl}
                              onChange={(event) => {
                                setMediaUrl(event.target.value);
                                clearError('mediaUrl');
                              }}
                              aria-invalid={!!errors.mediaUrl}
                              aria-describedby={errors.mediaUrl ? 'media-error' : 'media-hint'}
                            />
                            {mediaUrl && (
                              <button
                                type="button"
                                className={styles.mediaClear}
                                aria-label="ล้างลิงก์ YouTube"
                                onClick={() => {
                                  setMediaUrl('');
                                  setMediaPreview(null);
                                  clearError('mediaUrl');
                                }}
                              >
                                <X size={15} />
                              </button>
                            )}
                          </div>
                          {errors.mediaUrl && <p className={styles.error} id="media-error">{errors.mediaUrl}</p>}
                          {parsedMedia && (
                            <div className={styles.mediaPreviewCard}>
                              <img src={mediaPreview?.thumbnailUrl || parsedMedia.thumbnailUrl} alt="" width={84} height={48} />
                              <div className={styles.mediaPreviewMeta}>
                                <strong>{mediaPreviewLoading ? 'กำลังโหลดข้อมูลคลิป…' : (mediaPreview?.title || `YouTube (${parsedMedia.videoId})`)}</strong>
                                <span>
                                  {mediaPreview?.authorName || 'YouTube'}
                                  {parsedMedia.startSeconds > 0 ? ` · เริ่มที่ ${parsedMedia.startSeconds} วิ` : ''}
                                </span>
                              </div>
                              <span className={styles.mediaValidBadge}><Check size={12} /> พร้อมเล่น</span>
                            </div>
                          )}
                          <p className={styles.paymentHint} id="media-hint">
                            รองรับ youtube.com, youtu.be และ Shorts (กำหนดเริ่มคลิป เช่น ?t=30 ได้)
                            {method === 'truemoney' ? ` · หากยอดในซองต่ำกว่า ฿${moneyFormatter.format(mediaMinAmount)} โดเนทจะสำเร็จปกติโดยไม่เล่นคลิป` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>ช่องทางชำระเงิน</h3>
                  <div className={styles.paymentMethods} role="group" aria-label="ช่องทางชำระเงิน">
                    {METHODS.map(({ id, name: label, logo }) => <button type="button" key={id} aria-label={label} aria-pressed={method === id} className={`${styles.method} ${method === id ? styles.methodSelected : ''} ${styles[id]}`} onClick={() => changeMethod(id)}><span className={styles.paymentLogo}><img src={logo} alt="" width={100} height={34} /></span><span className={styles.selectionCheck}>{method === id && <Check size={11} strokeWidth={3} />}</span></button>)}
                  </div>
                  {errors.method && <p className={styles.error}>{errors.method}</p>}
                  {method === 'promptpay' ? <>
                  <div className={styles.labelRow}><label className={styles.label} htmlFor="donation-amount">จำนวนเงิน <span>*</span></label><span>เริ่มต้น {minAmount.toLocaleString('th-TH')} บาท</span></div>
                  <div className={styles.amounts} role="group" aria-label="จำนวนเงินสำเร็จรูป">{AMOUNTS.map((value) => <button type="button" key={value} disabled={value < minAmount} aria-pressed={Number(amount) === value} className={`${styles.amountButton} ${Number(amount) === value ? styles.amountSelected : ''}`} onClick={() => changeAmount(String(value))}><span className={styles.baht}>฿</span>{value}</button>)}</div>
                  <div className={styles.customAmount}><span>฿</span><input id="donation-amount" type="number" inputMode="decimal" min={minAmount} max="1000000" step="0.01" placeholder="ระบุจำนวนเงินเอง" value={amount} onChange={(event) => changeAmount(event.target.value)} aria-label="จำนวนเงินสนับสนุน กำหนดเอง" aria-required="true" aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'amount-error' : undefined} /><span>บาท</span></div>
                  {errors.amount && <p className={styles.error} id="amount-error">{errors.amount}</p>}
                  </> : <p className={styles.paymentHint}>ยอดโดเนทตามเงินที่รับได้จริงจากซอง</p>}
                </div>

                {method === 'truemoney' ? <div className={styles.formSection}>
                  <label className={styles.label} htmlFor="donation-voucher">ลิงก์ซองของขวัญ <span>*</span></label>
                  <input id="donation-voucher" className={`${styles.input} ${styles.voucherInput} ${errors.voucher ? styles.invalid : ''}`} type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://gift.truemoney.com/campaign/?v=…" value={voucher} onChange={(event) => { setVoucher(event.target.value); clearError('voucher'); }} aria-required="true" aria-invalid={!!errors.voucher} aria-describedby={errors.voucher ? 'voucher-error' : 'voucher-hint'} />
                  {errors.voucher && <p className={styles.error} id="voucher-error">{errors.voucher}</p>}
                  <p className={styles.paymentHint} id="voucher-hint">คัดลอกลิงก์ซองจากแอป TrueMoney มาวางที่นี่</p>
                </div> : qrData ? <>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle} ref={qrHeading} tabIndex={-1}>สแกน QR เพื่อโอนเงิน</h3>
                  <div className={styles.qrPanel}>
                    <span className={styles.qrBrand}><img src="/payments/promptpay.png" alt="PromptPay" width={132} height={44} /></span>
                    <img className={styles.qrImage} src={qrData.qrImage || qrData.qrDataUrl} alt={`QR PromptPay จำนวน ${displayAmount} บาท`} />
                    <strong className={styles.qrAmount}>฿{displayAmount} THB</strong>
                    <div className={styles.qrActions}>
                      <button type="button" onClick={copyPromptPay}><Copy size={14} />คัดลอกหมายเลข</button>
                      <button type="button" onClick={saveQrImage}><Download size={14} />บันทึก QR</button>
                    </div>
                    <span className={styles.qrTip}>ทริก: หากบันทึกไม่ได้ สามารถกดค้างที่รูป QR เพื่อบันทึกภาพได้โดยตรง</span>
                  </div>
                  <p className={styles.paymentHint}>ตรวจสอบผู้รับและยอดก่อนโอน หากโอนแล้วแต่ยืนยันไม่สำเร็จ ให้เก็บหลักฐานและติดต่อผู้ดูแลก่อนทำรายการซ้ำ</p>
                </div>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>แนบสลิปหลังโอนเงิน</h3>
                  <input className={styles.hiddenInput} ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="เลือกไฟล์สลิป" tabIndex={-1} onChange={(event) => selectFile(event.target.files?.[0])} />
                  <div className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${errors.slip ? styles.dropError : ''}`} onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}>
                    {file ? <div className={styles.filePreview}>{preview && <img src={preview} alt="ตัวอย่างสลิปที่เลือก" onError={() => { removeFile(); setErrors((previous) => ({ ...previous, slip: 'ไม่สามารถเปิดรูปภาพนี้ได้ กรุณาเลือกไฟล์ภาพอื่น' })); }} />}<div><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB <span className={styles.fileReady}><Check size={12} /> แนบแล้ว</span></span><button type="button" onClick={() => fileInput.current?.click()}>เปลี่ยนรูปภาพ</button></div><button type="button" className={styles.removeFile} aria-label="ลบสลิป" onClick={removeFile}><X size={17} /></button></div> : <button type="button" id="donation-slip" className={styles.uploadButton} onClick={() => fileInput.current?.click()} aria-invalid={!!errors.slip} aria-describedby={errors.slip ? 'slip-error' : 'slip-hint'}><span className={styles.uploadIcon}><UploadCloud size={23} /></span><strong>ลากไฟล์มาวางที่นี่ <span>หรือเลือกไฟล์</span></strong><span id="slip-hint">JPG, PNG หรือ WEBP ขนาดไม่เกิน 4 MB</span></button>}
                  </div>
                  {errors.slip && <p className={styles.error} id="slip-error">{errors.slip}</p>}
                </div>
                </> : null}

                <div className={styles.formBottom}>
                  <div className={styles.total}><span>ยอดโดเนท</span>{method === 'promptpay' ? <strong>฿{displayAmount}<span> THB</span></strong> : <span>ตามยอดที่รับได้จากซอง</span>}</div>
                  <button className={styles.submitButton} type="submit" disabled={busy || !!errors.name || !!errors.message}>{busy ? <><LoaderCircle size={20} className={styles.spinner} />{method === 'truemoney' ? 'กำลังรับซองของขวัญ…' : qrData ? 'กำลังตรวจสอบสลิป…' : 'กำลังสร้าง QR…'}</> : <>{method === 'truemoney' ? 'ยืนยันซองของขวัญ' : qrData ? `ยืนยันสลิป ฿${displayAmount}` : `สร้าง QR พร้อมเพย์ ฿${displayAmount}`}<ArrowRight size={19} className={styles.submitArrow} /></>}</button>
                  <p className={styles.paymentNotice}><ShieldCheck size={13} />{method === 'truemoney' ? 'กดยืนยันเพื่อรับเงินจริงจากซองของขวัญ' : 'ยืนยันการสนับสนุนหลังตรวจสอบสลิปสำเร็จ'}</p>
                </div>
              </fieldset>
            </form>
          )}
        </section>
      </main>

      <footer className={styles.footer}><span>© {new Date().getFullYear()} {profile.name}</span><div><button onClick={() => openInfo('privacy')}>ความเป็นส่วนตัว</button><span>·</span><button onClick={() => openInfo('terms')}>เงื่อนไขการใช้งาน</button></div></footer>

      <dialog className={styles.infoDialog} ref={infoDialog} onClick={(event) => { if (event.target === event.currentTarget) infoDialog.current?.close(); }} aria-labelledby="info-heading"><div><button className={styles.dialogClose} aria-label="ปิดหน้าต่าง" onClick={() => infoDialog.current?.close()}><X size={20} /></button><span className={styles.headerHeart}><CircleHelp size={25} /></span><h2 id="info-heading">{INFO[info].title}</h2><p>{INFO[info].text}</p><button className={styles.submitButton} onClick={() => infoDialog.current?.close()}>เข้าใจแล้ว <Check size={18} /></button></div></dialog>
      <div className={styles.toastRegion} aria-live="polite" aria-atomic="true">{toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.error ? <CircleHelp size={20} /> : <CheckCheck size={20} />}<span>{toast.text}</span><button aria-label="ปิดการแจ้งเตือน" onClick={() => setToast(null)}><X size={16} /></button></div>}</div>
    </div>
  );
}
