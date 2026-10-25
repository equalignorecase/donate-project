import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDonation, validateSlip } from '../lib/donation-form.ts';

test('PromptPay validates the configured minimum and requires a slip only after QR creation', () => {
  assert.deepEqual(validateDonation({ name: 'ผู้ชม', amount: '20.50', message: 'สู้ ๆ', method: 'promptpay', hasSlip: false }), {});
  assert.ok(validateDonation({ name: 'ผู้ชม', amount: '20', message: '', method: 'promptpay', hasSlip: false, requireSlip: true }).slip);
  assert.ok(validateDonation({ name: 'ผู้ชม', amount: '20', message: '', method: 'promptpay', hasSlip: true, minAmount: 50 }).amount);
  assert.ok(validateDonation({ name: 'ผู้ชม', amount: '1000000.01', message: '', method: 'promptpay', hasSlip: true }).amount);
});

test('TrueMoney requires an official gift URL but no amount or slip', () => {
  const input = { name: 'ผู้ชม', amount: '', message: '', method: 'truemoney', hasSlip: false, voucher: 'https://gift.truemoney.com/campaign/?v=abc123' };
  assert.deepEqual(validateDonation(input), {});
  for (const voucher of ['', 'https://evil.example/?v=abc', 'https://gift.truemoney.com.evil.example/campaign/?v=abc', 'http://gift.truemoney.com/campaign/?v=abc', 'https://gift.truemoney.com/campaign/']) {
    assert.ok(validateDonation({ ...input, voucher }).voucher);
  }
});

test('bank payment is no longer accepted', () => {
  assert.ok(validateDonation({ name: 'ผู้ชม', amount: '50', message: '', method: 'bank', hasSlip: true }).method);
});

test('blank names, invalid amounts, missing slips and unknown methods are rejected', () => {
  for (const amount of ['', '0', '-1', 'NaN', 'Infinity', '1abc', '1.001', '0.50']) {
    const errors = validateDonation({ name: '  ', amount, message: '', method: 'promptpay', hasSlip: false, requireSlip: true });
    assert.ok(errors.name);
    assert.ok(errors.amount, `must reject ${amount}`);
    assert.ok(errors.slip);
  }
});

test('name and message length limits apply to pasted or submitted data', () => {
  const errors = validateDonation({ name: 'ก'.repeat(51), amount: '10', message: 'ก'.repeat(201), method: 'promptpay', hasSlip: true });
  assert.ok(errors.name);
  assert.ok(errors.message);
});

test('slips accept supported images up to 4 MB and reject other or empty files', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
    assert.equal(validateSlip({ type, size: 4 * 1024 * 1024 }), undefined);
  }
  for (const file of [{ type: 'image/svg+xml', size: 40 }, { type: 'application/pdf', size: 40 }, { type: 'image/png', size: 0 }, { type: 'image/png', size: 4 * 1024 * 1024 + 1 }]) {
    assert.ok(validateSlip(file));
  }
});
