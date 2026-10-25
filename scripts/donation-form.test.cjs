const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const originalRequire = module.require.bind(module);
    module.require = (name) => {
      if (name.startsWith('@/')) {
        return originalRequire(path.join(__dirname, '..', name.slice(2)));
      }
      return originalRequire(name);
    };
    const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    module._compile(result.outputText, filename);
  };
}

const { validateDonation, validateSlip } = require('../lib/donation-form.ts');

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

test('rejects profanity and vulgar words in name and message', () => {
  const badName = validateDonation({ name: 'ไอ้สัส', amount: '20', message: 'ข้อความดีๆ', method: 'promptpay', hasSlip: true });
  assert.equal(badName.name, 'ชื่อมีคำไม่สุภาพหรือไม่เหมาะสม');

  const badMsg = validateDonation({ name: 'ผู้สนับสนุน', amount: '20', message: 'ควยเอ้ย', method: 'promptpay', hasSlip: true });
  assert.equal(badMsg.message, 'ข้อความมีคำไม่สุภาพหรือไม่เหมาะสม');

  const customBlocked = validateDonation({
    name: 'สปอนเซอร์เว็บพนัน',
    amount: '20',
    message: '',
    method: 'promptpay',
    hasSlip: true,
    customBlacklist: ['เว็บพนัน']
  });
  assert.equal(customBlocked.name, 'ชื่อมีคำไม่สุภาพหรือไม่เหมาะสม');
});
