const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const originalRequire = module.require.bind(module);
    module.require = (name) => originalRequire(name.startsWith('@/') ? path.join(__dirname, '..', name.slice(2)) : name);
    const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    module._compile(result.outputText, filename);
  };
}
require.extensions['.css'] = () => {};

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { qrCardDefaults, validQrCardAppearance, readQrCardAppearance } = require('../lib/qrCardAppearance.ts');
const QrCardWidget = require('../app/overlay/qr/QrCardWidget.tsx').default;

test('validQrCardAppearance validates mode, layout, URLs, colors, and ranges', () => {
  assert.equal(validQrCardAppearance('qr_card_mode', 'qr'), true);
  assert.equal(validQrCardAppearance('qr_card_mode', 'image'), true);
  assert.equal(validQrCardAppearance('qr_card_mode', 'invalid'), false);

  assert.equal(validQrCardAppearance('qr_card_layout', 'horizontal'), true);
  assert.equal(validQrCardAppearance('qr_card_qr_url', 'https://example.com/donate'), true);
  assert.equal(validQrCardAppearance('qr_card_qr_url', 'javascript:alert(1)'), false);
  assert.equal(validQrCardAppearance('qr_card_image_url', '/uploads/banner.png'), true);
  assert.equal(validQrCardAppearance('qr_card_title_color', '#ff00aa'), true);
  assert.equal(validQrCardAppearance('qr_card_title_color', 'red'), false);
  assert.equal(validQrCardAppearance('qr_card_gap', '24'), true);
  assert.equal(validQrCardAppearance('qr_card_gap', '999'), false);
});

test('readQrCardAppearance merges valid overrides over defaults', () => {
  const parsed = readQrCardAppearance({
    qr_card_mode: 'image',
    qr_card_layout: 'horizontal',
    qr_card_gap: '28',
    qr_card_title_color: 'invalid-hex',
  });
  assert.equal(parsed.qr_card_mode, 'image');
  assert.equal(parsed.qr_card_layout, 'horizontal');
  assert.equal(parsed.qr_card_gap, '28');
  assert.equal(parsed.qr_card_title_color, qrCardDefaults.qr_card_title_color);
});

test('QrCardWidget renders image mode with title, subtitle, and rainbow border', () => {
  const html = renderToStaticMarkup(
    React.createElement(QrCardWidget, {
      appearance: {
        ...qrCardDefaults,
        qr_card_mode: 'image',
        qr_card_image_url: 'https://example.com/qr.png',
        qr_card_title: 'สแกนจ่ายได้เลย',
        qr_card_subtitle: 'ขึ้นจอทันที',
        qr_card_rainbow_border: 'true',
      },
    })
  );
  assert.ok(html.includes('https://example.com/qr.png'));
  assert.ok(html.includes('สแกนจ่ายได้เลย'));
  assert.ok(html.includes('ขึ้นจอทันที'));
  assert.ok(html.includes('supporter-beam-rainbow'));
  assert.ok(html.includes('qr-card-shine-beam'));
});

test('QrCardWidget respects independent card/title/subtitle shine toggles', () => {
  const html = renderToStaticMarkup(
    React.createElement(QrCardWidget, {
      appearance: {
        ...qrCardDefaults,
        qr_card_shine_sweep: 'true',
        qr_card_shine_card: 'false',
        qr_card_shine_title: 'false',
        qr_card_shine_subtitle: 'true',
      },
    })
  );
  assert.ok(!html.includes('qr-card-shine-beam'));
  assert.ok(html.includes('qr-card-text-shine'));
});
