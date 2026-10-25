import test from 'node:test';
import assert from 'node:assert/strict';
import { createDonationQr, verifyDonation, redeemDonation, loadDonationWidgets } from '../lib/donation-client.ts';

const verified = { id: 42, name: 'ผู้ชม', message: 'สู้ ๆ', amount: 75, status: 'verified', transaction_ref: 'REAL-REF' };
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });

test('public stats request three all-time supporters and preserve an empty result', async () => {
  const data = { goal: { title: 'เป้าหมาย', current: 0, target: 1000 }, allTime: [] };
  const signal = new AbortController().signal;
  const result = await loadDonationWidgets(signal, async (url, init) => {
    assert.equal(url, '/api/widgets?limit=3');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.signal, signal);
    return reply({ success: true, data });
  });
  assert.deepEqual(result, data);
});

test('failed or incomplete stats cannot display a fake zero total', async () => {
  const signal = new AbortController().signal;
  await assert.rejects(loadDonationWidgets(signal, async () => reply({ success: false }, 500)), /โหลด/);
  await assert.rejects(loadDonationWidgets(signal, async () => reply({ success: true, data: {} })));
});

test('QR creation sends the chosen amount and returns the server QR', async () => {
  const qr = { amount: 50, promptpayId: '0812345678', qrDataUrl: 'data:image/png;base64,abc', payload: 'qr-payload' };
  const result = await createDonationQr(50, async (url, init) => {
    assert.equal(url, '/api/donate/generate-qr');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { amount: 50 });
    return reply({ success: true, data: qr });
  });
  assert.deepEqual(result, qr);
});

test('slip submission uploads the actual file, donor and amount as multipart data', async () => {
  const slip = new File(['image'], 'slip.png', { type: 'image/png' });
  const result = await verifyDonation({ name: 'ผู้ชม', message: 'สู้ ๆ', amount: '75', slip }, async (url, init) => {
    assert.equal(url, '/api/donate/verify-slip');
    assert.equal(init.method, 'POST');
    assert.ok(init.body instanceof FormData);
    assert.equal(init.body.get('name'), 'ผู้ชม');
    assert.equal(init.body.get('amount'), '75');
    assert.equal(init.body.get('message'), 'สู้ ๆ');
    assert.equal(await init.body.get('slip').text(), 'image');
    assert.equal(init.body.has('simulate'), false);
    assert.equal(init.headers, undefined);
    return reply({ success: true, data: verified });
  });
  assert.deepEqual(result, verified);
});

test('wallet sends the voucher URL and uses the redeemed amount from the server', async () => {
  const result = await redeemDonation({ name: 'ผู้ชม', message: 'สู้ ๆ', voucher: ' https://gift.truemoney.com/campaign/?v=abc123 ' }, async (url, init) => {
    assert.equal(url, '/api/donate/truemoney');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { name: 'ผู้ชม', message: 'สู้ ๆ', voucher_url: 'https://gift.truemoney.com/campaign/?v=abc123' });
    return reply({ success: true, data: verified });
  });
  assert.equal(result.amount, 75);
});

test('API rejection and unreadable responses cannot produce a successful donation', async () => {
  await assert.rejects(createDonationQr(50, async () => reply({ success: false, message: 'กรุณาตั้งค่าพร้อมเพย์' }, 500)), /กรุณาตั้งค่าพร้อมเพย์/);
  await assert.rejects(redeemDonation({ name: 'ผู้ชม', message: '', voucher: 'url' }, async () => reply({ success: false, message: 'ซองถูกใช้แล้ว' }, 400)), /ซองถูกใช้แล้ว/);
  await assert.rejects(redeemDonation({ name: 'ผู้ชม', message: '', voucher: 'url' }, async () => new Response('upstream error', { status: 502 })));
  await assert.rejects(redeemDonation({ name: 'ผู้ชม', message: '', voucher: 'url' }, async () => reply({ success: true, data: { amount: 0 } })));
});
