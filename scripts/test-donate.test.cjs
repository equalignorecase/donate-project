const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

for (const extension of ['.ts', '.tsx']) {
  if (!require.extensions[extension]) {
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
}

const {
  TEST_DONATE_DEFAULT_NAME,
  TEST_DONATE_DEFAULT_MESSAGE,
  validateAndBuildTestDonationInput,
} = require('../lib/test-donate.ts');

test('validateAndBuildTestDonationInput applies defaults when omitted', () => {
  const res = validateAndBuildTestDonationInput({});
  assert.equal(res.ok, true);
  assert.equal(res.data.name, TEST_DONATE_DEFAULT_NAME);
  assert.equal(res.data.amount, 50);
  assert.equal(res.data.message, TEST_DONATE_DEFAULT_MESSAGE);
  assert.equal(res.data.mediaUrl, undefined);
});

test('validateAndBuildTestDonationInput preserves explicit empty message and rounds amount cleanly', () => {
  const res = validateAndBuildTestDonationInput({
    name: '  Tester  ',
    amount: 123.456,
    message: '   ',
  });
  assert.equal(res.ok, true);
  assert.equal(res.data.name, 'Tester');
  assert.equal(res.data.amount, 123.46);
  assert.equal(res.data.message, '');
});

test('validateAndBuildTestDonationInput rejects invalid, zero, negative, or oversized amounts', () => {
  for (const bad of ['', '0', 0, -50, 'abc', 1000001]) {
    const res = validateAndBuildTestDonationInput({ amount: bad });
    assert.equal(res.ok, false);
  }
});

test('validateAndBuildTestDonationInput validates and canonicalizes optional YouTube media_url', () => {
  const valid = validateAndBuildTestDonationInput({
    amount: 100,
    media_url: 'https://youtu.be/dQw4w9WgXcQ?t=45',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.data.mediaUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s');

  const invalid = validateAndBuildTestDonationInput({
    amount: 100,
    media_url: 'https://evil.example/watch?v=dQw4w9WgXcQ',
  });
  assert.equal(invalid.ok, false);
});

test('validateAndBuildTestDonationInput clamps long name and message', () => {
  const res = validateAndBuildTestDonationInput({
    name: 'N'.repeat(100),
    amount: 50,
    message: 'M'.repeat(300),
  });
  assert.equal(res.ok, true);
  assert.equal(res.data.name.length, 50);
  assert.equal(res.data.message.length, 200);
});
