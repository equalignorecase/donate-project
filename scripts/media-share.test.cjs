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
  parseYouTubeUrl,
  parseYouTubeTimeParam,
  getMediaShareConfig,
  isMissingMediaUrlColumnError,
  buildYouTubeEmbedPlayerUrl,
} = require('../lib/media-share.ts');

test('parseYouTubeTimeParam parses numeric and h/m/s durations cleanly', () => {
  assert.equal(parseYouTubeTimeParam('90'), 90);
  assert.equal(parseYouTubeTimeParam('45s'), 45);
  assert.equal(parseYouTubeTimeParam('2m15s'), 135);
  assert.equal(parseYouTubeTimeParam('1h2m3s'), 3723);
  assert.equal(parseYouTubeTimeParam('bad'), 0);
  assert.equal(parseYouTubeTimeParam(null), 0);
});

test('parseYouTubeUrl accepts watch, youtu.be, shorts and live URLs and canonicalizes them', () => {
  const watch = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s&si=tracking');
  assert.equal(watch.videoId, 'dQw4w9WgXcQ');
  assert.equal(watch.startSeconds, 90);
  assert.equal(watch.canonicalUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90s');

  const short = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=15');
  assert.equal(short.videoId, 'dQw4w9WgXcQ');
  assert.equal(short.startSeconds, 15);
  assert.equal(short.canonicalUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=15s');

  const shorts = parseYouTubeUrl('https://youtube.com/shorts/dQw4w9WgXcQ');
  assert.equal(shorts.videoId, 'dQw4w9WgXcQ');
  assert.equal(shorts.canonicalUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  const live = parseYouTubeUrl('https://m.youtube.com/live/dQw4w9WgXcQ');
  assert.equal(live.videoId, 'dQw4w9WgXcQ');
});

test('parseYouTubeUrl rejects non-YouTube hosts, spoofed domains, unsafe schemes and bad video IDs', () => {
  const invalidUrls = [
    '',
    'javascript:alert(1)',
    'ftp://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://evil.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=too_short',
    'https://www.youtube.com/playlist?list=PL12345',
    'https://tiktok.com/@user/video/123',
  ];
  for (const url of invalidUrls) {
    assert.equal(parseYouTubeUrl(url), null, `should reject ${url}`);
  }
});

test('getMediaShareConfig applies defaults and bounds cleanly', () => {
  assert.deepEqual(getMediaShareConfig(undefined), {
    enabled: false,
    minAmount: 20,
    maxDuration: 60,
    volume: 70,
  });

  assert.deepEqual(
    getMediaShareConfig({
      media_share_enabled: 'true',
      media_share_min_amount: '50',
      media_share_max_duration: '999',
      media_share_volume: '120',
    }),
    {
      enabled: true,
      minAmount: 50,
      maxDuration: 600,
      volume: 100,
    }
  );
});

test('isMissingMediaUrlColumnError detects missing schema column errors only', () => {
  assert.equal(isMissingMediaUrlColumnError({ code: '42703', message: 'column "media_url" does not exist' }), true);
  assert.equal(isMissingMediaUrlColumnError({ code: 'PGRST204', message: "Could not find the 'media_url' column of 'donations'" }), true);
  assert.equal(isMissingMediaUrlColumnError({ code: '23505', message: 'duplicate key value' }), false);
});

test('buildYouTubeEmbedPlayerUrl builds autoplay and mute URL params cleanly', () => {
  const mutedUrl = new URL(
    buildYouTubeEmbedPlayerUrl({
      videoId: 'dQw4w9WgXcQ',
      startSeconds: 45,
      origin: 'http://localhost:3000',
      muted: true,
    })
  );
  assert.equal(mutedUrl.pathname, '/embed/dQw4w9WgXcQ');
  assert.equal(mutedUrl.searchParams.get('autoplay'), '1');
  assert.equal(mutedUrl.searchParams.get('mute'), '1');
  assert.equal(mutedUrl.searchParams.get('enablejsapi'), '1');
  assert.equal(mutedUrl.searchParams.get('start'), '45');
  assert.equal(mutedUrl.searchParams.get('origin'), 'http://localhost:3000');

  const audioUrl = new URL(
    buildYouTubeEmbedPlayerUrl({
      videoId: 'dQw4w9WgXcQ',
      muted: false,
    })
  );
  assert.equal(audioUrl.searchParams.get('mute'), '0');
  assert.equal(audioUrl.searchParams.get('start'), null);
});
