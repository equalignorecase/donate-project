import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: donations, error, count } = await supabaseAdmin
      .from('donations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      donations: donations || [],
      total: count ?? (donations ? donations.length : 0)
    });
  } catch (err: any) {
    console.error('Error fetching donations:', err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      amount,
      message,
      status = 'verified',
      transaction_ref,
      triggerAlert = false
    } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, message: 'ยอดเงินไม่ถูกต้อง' }, { status: 400 });
    }

    const cleanName = (name || '').trim().slice(0, 50) || 'ผู้สนับสนุนนิรนาม';
    const cleanMessage = (message || '').trim().slice(0, 200);
    const uniqueRef = (transaction_ref || '').trim() || `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newRecord: any = {
      name: cleanName,
      amount: parsedAmount,
      message: cleanMessage,
      transaction_ref: uniqueRef,
      sender_name: cleanName,
      sender_bank: 'MANUAL',
      receiver_name: 'สตรีมเมอร์',
      transaction_date: new Date().toISOString(),
      status: status || 'verified'
    };

    const { data: inserted, error } = await supabaseAdmin
      .from('donations')
      .insert([newRecord])
      .select()
      .single();

    if (error) throw error;

    if (triggerAlert && inserted.status === 'verified') {
      const channel = supabaseAdmin.channel('donation-alerts');
      try {
        await channel.httpSend('donation', {
          id: inserted.id,
          name: inserted.name,
          amount: inserted.amount,
          message: inserted.message
        });
      } catch (realtimeErr: any) {
        console.warn('Realtime alert broadcast error:', realtimeErr.message);
      } finally {
        await supabaseAdmin.removeChannel(channel).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, donation: inserted });
  } catch (err: any) {
    console.error('Error creating donation:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, amount, message, status, transaction_ref, triggerAlert } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ไม่พบ ID รายการโดเนท' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = String(name).trim().slice(0, 50) || 'ผู้สนับสนุนนิรนาม';
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        return NextResponse.json({ success: false, message: 'ยอดเงินไม่ถูกต้อง' }, { status: 400 });
      }
      updates.amount = parsed;
    }
    if (message !== undefined) updates.message = String(message).trim().slice(0, 200);
    if (status !== undefined) updates.status = status;
    if (transaction_ref !== undefined && String(transaction_ref).trim()) {
      updates.transaction_ref = String(transaction_ref).trim();
    }

    const { data: updated, error } = await supabaseAdmin
      .from('donations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (triggerAlert && updated.status === 'verified') {
      const channel = supabaseAdmin.channel('donation-alerts');
      try {
        await channel.httpSend('donation', {
          id: updated.id,
          name: updated.name,
          amount: updated.amount,
          message: updated.message
        });
      } catch (realtimeErr: any) {
        console.warn('Realtime alert broadcast error on edit:', realtimeErr.message);
      } finally {
        await supabaseAdmin.removeChannel(channel).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, donation: updated });
  } catch (err: any) {
    console.error('Error updating donation:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const scope = searchParams.get('scope');

    if (scope === 'failed') {
      const { error, count } = await supabaseAdmin
        .from('donations')
        .delete({ count: 'exact' })
        .eq('status', 'failed');

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: `ลบรายการที่ไม่ผ่านทั้งหมด ${count || 0} รายการเรียบร้อยแล้ว`,
        count
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'ไม่พบ ID รายการโดเนท' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('donations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'ลบรายการโดเนทเรียบร้อยแล้ว' });
  } catch (err: any) {
    console.error('Error deleting donation:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
