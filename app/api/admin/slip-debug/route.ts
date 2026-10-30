import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAuth } from '@/lib/auth';
import { checkQuota, isThaiNameMatch, ERROR_CODE_MESSAGES } from '@/lib/services/slipok';

export const dynamic = 'force-dynamic';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getSettingValue(key: string, fallback: string = ''): Promise<string> {
  try {
    const { data } = await supabaseAdmin.from('settings').select('value').eq('key', key).single();
    if (data && data.value) return data.value;
  } catch (e) {}
  return fallback;
}

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const branchId = await getSettingValue('slipok_branch_id', process.env.SLIPOK_BRANCH_ID || '');
    const apiKey = await getSettingValue('slipok_api_key', process.env.SLIPOK_API_KEY || '');
    const receiverName = await getSettingValue('receiver_name', process.env.RECEIVER_NAME || '');
    const receiverAccount = await getSettingValue('receiver_account', process.env.RECEIVER_ACCOUNT || '');
    const promptpayId = await getSettingValue('promptpay_id', process.env.PROMPTPAY_ID || '');

    const isConfigured = Boolean(branchId && apiKey);
    let quotaData: any = null;
    let quotaError: string | null = null;

    if (isConfigured) {
      try {
        quotaData = await checkQuota();
      } catch (qErr: any) {
        quotaError = qErr.response?.data?.message || qErr.message;
      }
    }

    return NextResponse.json({
      success: true,
      config: {
        isConfigured,
        branchIdMasked: branchId ? `${branchId.slice(0, 3)}***` : '',
        hasApiKey: Boolean(apiKey),
        receiverName,
        receiverAccount,
        promptpayId,
      },
      quota: quotaData,
      quotaError
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const slipFile = formData.get('slip') as File | null;
    const expectedAmountStr = (formData.get('expectedAmount') || '').toString().trim();
    const isDryRun = formData.get('dryRun') !== 'false'; // default to true

    if (!slipFile || !(slipFile instanceof Blob)) {
      return NextResponse.json({ success: false, message: 'กรุณาอัปโหลดไฟล์รูปภาพสลิป' }, { status: 400 });
    }

    const branchId = await getSettingValue('slipok_branch_id', process.env.SLIPOK_BRANCH_ID || '');
    const apiKey = await getSettingValue('slipok_api_key', process.env.SLIPOK_API_KEY || '');

    if (!branchId || !apiKey) {
      return NextResponse.json({
        success: false,
        message: 'ยังไม่ได้ตั้งค่า SlipOK Branch ID หรือ API Key ในระบบ'
      }, { status: 400 });
    }

    const buffer = Buffer.from(await slipFile.arrayBuffer());
    const mimeType = slipFile.type || 'image/jpeg';
    const fileName = slipFile.name || 'debug_slip.jpg';

    const slipokForm = new FormData();
    slipokForm.append('files', buffer, {
      filename: fileName,
      contentType: mimeType
    });

    if (expectedAmountStr) {
      const parsedAmount = parseFloat(expectedAmountStr);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        slipokForm.append('amount', parsedAmount);
      }
    }

    slipokForm.append('log', isDryRun ? 'false' : 'true');

    const url = `https://api.slipok.com/api/line/apikey/${branchId}`;

    let slipokResponseStatus = 200;
    let slipokRawJson: any = null;
    let slipokErrorMessage: string | null = null;
    let slipokErrorCode: number | null = null;

    try {
      const res = await axios.post(url, slipokForm, {
        headers: {
          ...slipokForm.getHeaders(),
          'x-authorization': apiKey,
          'User-Agent': USER_AGENT
        },
        timeout: 25000
      });
      slipokResponseStatus = res.status;
      slipokRawJson = res.data;
    } catch (apiErr: any) {
      if (apiErr.response) {
        slipokResponseStatus = apiErr.response.status;
        slipokRawJson = apiErr.response.data;
        slipokErrorCode = apiErr.response.data?.code || null;
        slipokErrorMessage =
          (slipokErrorCode ? ERROR_CODE_MESSAGES[slipokErrorCode] : null) ||
          apiErr.response.data?.message ||
          'การตรวจสอบสลิปล้มเหลว';
      } else {
        return NextResponse.json({
          success: false,
          message: `ไม่สามารถเชื่อมต่อ SlipOK API ได้: ${apiErr.message}`
        }, { status: 502 });
      }
    }

    // Diagnostics Analysis
    const expectedReceiverName = await getSettingValue('receiver_name', process.env.RECEIVER_NAME || '');
    const expectedReceiverAccount = await getSettingValue('receiver_account', process.env.RECEIVER_ACCOUNT || '');
    const promptpayId = await getSettingValue('promptpay_id', process.env.PROMPTPAY_ID || '');

    const slipData = slipokRawJson?.data;
    const diagnostics = {
      isSuccess: Boolean(slipokRawJson?.success && slipData),
      httpStatus: slipokResponseStatus,
      errorCode: slipokErrorCode,
      errorMessage: slipokErrorMessage,
      dryRun: isDryRun,
      transRef: slipData?.transRef || null,
      duplicateCheck: {
        isDuplicate: false,
        existingDonationId: null as any,
        existingCreatedAt: null as string | null
      },
      amountCheck: {
        expected: expectedAmountStr ? parseFloat(expectedAmountStr) : null,
        slipAmount: slipData?.amount ? parseFloat(slipData.amount) : null,
        matches: true
      },
      receiverCheck: {
        configuredName: expectedReceiverName,
        configuredAccount: expectedReceiverAccount,
        configuredPromptpay: promptpayId,
        slipReceiverName: slipData?.receiver?.displayName || slipData?.receiver?.name || null,
        slipReceiverAccount: slipData?.receiver?.account?.value || null,
        nameMatches: true,
        accountMatches: true
      }
    };

    // Check Duplicate TransRef in database
    if (slipData?.transRef) {
      const { data: existingDonation } = await supabaseAdmin
        .from('donations')
        .select('id, created_at, status')
        .eq('transaction_ref', slipData.transRef)
        .neq('status', 'failed')
        .maybeSingle();

      if (existingDonation) {
        diagnostics.duplicateCheck = {
          isDuplicate: true,
          existingDonationId: existingDonation.id,
          existingCreatedAt: existingDonation.created_at || null
        };
      }
    }

    // Check Amount
    if (diagnostics.amountCheck.expected !== null && diagnostics.amountCheck.slipAmount !== null) {
      diagnostics.amountCheck.matches =
        Math.abs(diagnostics.amountCheck.expected - diagnostics.amountCheck.slipAmount) <= 0.001;
    }

    // Check Receiver
    if (slipData) {
      if (expectedReceiverName && diagnostics.receiverCheck.slipReceiverName) {
        diagnostics.receiverCheck.nameMatches = isThaiNameMatch(
          diagnostics.receiverCheck.slipReceiverName,
          expectedReceiverName
        );
      }

      const allAccounts = [expectedReceiverAccount, promptpayId]
        .filter(Boolean)
        .join(',')
        .split(/[,;\s]+/)
        .map((s) => s.replace(/[^0-9]/g, ''))
        .filter((s) => s.length >= 4);

      if (allAccounts.length > 0 && diagnostics.receiverCheck.slipReceiverAccount) {
        const cleanSlipAcc = diagnostics.receiverCheck.slipReceiverAccount.replace(/[^0-9]/g, '');
        diagnostics.receiverCheck.accountMatches = allAccounts.some((acc) => {
          if (cleanSlipAcc.includes(acc) || acc.includes(cleanSlipAcc)) return true;
          const tail = acc.slice(-4);
          return cleanSlipAcc.endsWith(tail);
        });
      }
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      rawResponse: slipokRawJson
    });
  } catch (err: any) {
    console.error('Slip debug error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

