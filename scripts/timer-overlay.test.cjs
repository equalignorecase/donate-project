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

const { formatDeltaMinutes, readTimerAppearance } = require('../lib/timerLogic.ts');

test('formatDeltaMinutes formats time deltas into readable Thai strings', () => {
  assert.equal(formatDeltaMinutes(300), '+5 นาที');
  assert.equal(formatDeltaMinutes(-600), '-10 นาที');
  assert.equal(formatDeltaMinutes(3600), '+1 ชม.');
  assert.equal(formatDeltaMinutes(3660), '+1 ชม. 1 นาที');
  assert.equal(formatDeltaMinutes(45), '+45 วินาที');
  assert.equal(formatDeltaMinutes(0), '0 นาที');
});

test('readTimerAppearance parses show_rate_banner correctly', () => {
  const fromEmpty = readTimerAppearance({});
  assert.equal(fromEmpty.show_rate_banner, true);

  const fromStringFalse = readTimerAppearance({ timer_show_rate_banner: 'false' });
  assert.equal(fromStringFalse.show_rate_banner, false);

  const fromJson = readTimerAppearance({ timer_appearance: JSON.stringify({ show_rate_banner: false }) });
  assert.equal(fromJson.show_rate_banner, false);
});
