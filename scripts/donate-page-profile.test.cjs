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
  DONATE_PAGE_DEFAULTS,
  DONATE_PAGE_SETTING_KEYS,
  sanitizePublicUrl,
  getDonatePageProfile,
} = require('../lib/donate-page-profile.ts');

test('sanitizePublicUrl allows http/https and rejects unsafe protocols', () => {
  assert.equal(sanitizePublicUrl('https://example.com/img.png'), 'https://example.com/img.png');
  assert.equal(sanitizePublicUrl('  http://example.com/a  '), 'http://example.com/a');
  assert.equal(sanitizePublicUrl('javascript:alert(1)'), '');
  assert.equal(sanitizePublicUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(sanitizePublicUrl('//evil.com/x.png', true), '');
  assert.equal(sanitizePublicUrl('/avatar.png', false), '');
  assert.equal(sanitizePublicUrl('/uploads/alert-media/pic.png', true), '/uploads/alert-media/pic.png');
});

test('getDonatePageProfile falls back to defaults when keys are absent', () => {
  const profile = getDonatePageProfile({});
  assert.equal(profile.name, DONATE_PAGE_DEFAULTS.name);
  assert.equal(profile.handle, DONATE_PAGE_DEFAULTS.handle);
  assert.equal(profile.bio, DONATE_PAGE_DEFAULTS.bio);
  assert.equal(profile.avatarUrl, DONATE_PAGE_DEFAULTS.avatarUrl);
  assert.equal(profile.heroUrl, DONATE_PAGE_DEFAULTS.heroUrl);
  assert.deepEqual(profile.socialLinks, []);
});

test('getDonatePageProfile preserves explicit empty optional fields and falls back on blank name/avatar', () => {
  const profile = getDonatePageProfile({
    [DONATE_PAGE_SETTING_KEYS.name]: '   ',
    [DONATE_PAGE_SETTING_KEYS.handle]: '',
    [DONATE_PAGE_SETTING_KEYS.bio]: '   ',
    [DONATE_PAGE_SETTING_KEYS.avatarUrl]: '',
    [DONATE_PAGE_SETTING_KEYS.heroUrl]: '',
  });
  assert.equal(profile.name, DONATE_PAGE_DEFAULTS.name);
  assert.equal(profile.handle, '');
  assert.equal(profile.bio, '');
  assert.equal(profile.avatarUrl, DONATE_PAGE_DEFAULTS.avatarUrl);
  assert.equal(profile.heroUrl, '');
});

test('getDonatePageProfile clamps field lengths', () => {
  const profile = getDonatePageProfile({
    [DONATE_PAGE_SETTING_KEYS.name]: 'N'.repeat(100),
    [DONATE_PAGE_SETTING_KEYS.handle]: 'H'.repeat(100),
    [DONATE_PAGE_SETTING_KEYS.bio]: 'B'.repeat(400),
  });
  assert.equal(profile.name.length, 60);
  assert.equal(profile.handle.length, 60);
  assert.equal(profile.bio.length, 300);
});

test('getDonatePageProfile builds socialLinks and auto-detects X vs Instagram', () => {
  const withX = getDonatePageProfile({
    [DONATE_PAGE_SETTING_KEYS.socialDiscord]: 'https://discord.gg/abc',
    [DONATE_PAGE_SETTING_KEYS.socialTiktok]: 'javascript:alert(1)',
    [DONATE_PAGE_SETTING_KEYS.socialYoutube]: 'https://www.youtube.com/@nut',
    [DONATE_PAGE_SETTING_KEYS.socialTwitch]: '',
    [DONATE_PAGE_SETTING_KEYS.socialInstagramOrX]: 'https://x.com/nutvlr',
  });
  assert.equal(withX.socialLinks.length, 3);
  assert.deepEqual(
    withX.socialLinks.map((item) => item.platform),
    ['discord', 'youtube', 'x']
  );

  const withTwitter = getDonatePageProfile({
    [DONATE_PAGE_SETTING_KEYS.socialInstagramOrX]: 'https://twitter.com/nutvlr',
  });
  assert.equal(withTwitter.socialLinks[0].platform, 'x');

  const withIg = getDonatePageProfile({
    [DONATE_PAGE_SETTING_KEYS.socialInstagramOrX]: 'https://www.instagram.com/nutvlr/',
  });
  assert.equal(withIg.socialLinks[0].platform, 'instagram');
  assert.equal(withIg.socialLinks[0].label, 'Instagram');
});
