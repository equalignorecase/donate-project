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

const { checkTrueMoneyHealth } = require('../lib/truemoney-health.ts');

test('checkTrueMoneyHealth returns offline when url is missing', async () => {
  const result = await checkTrueMoneyHealth(undefined);
  assert.equal(result.success, false);
  assert.equal(result.status, 'offline');
  assert.match(result.message, /TRUEMONEY_API_URL/);
});

test('checkTrueMoneyHealth returns offline when url protocol is invalid', async () => {
  const result = await checkTrueMoneyHealth('ftp://invalid.url');
  assert.equal(result.success, false);
  assert.equal(result.status, 'offline');
  assert.match(result.message, /ไม่ถูกต้อง/);
});

test('checkTrueMoneyHealth returns online when fetch returns HTTP 200 JSON', async () => {
  const mockFetch = async (url) => {
    assert.equal(url, 'https://wallet.example.com/health');
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', engine: 'curl_cffi' }),
    };
  };

  const result = await checkTrueMoneyHealth('https://wallet.example.com', mockFetch);
  assert.equal(result.success, true);
  assert.equal(result.status, 'online');
  assert.equal(result.statusCode, 200);
  assert.equal(result.apiUrl, 'https://wallet.example.com/health');
  assert.equal(result.data.status, 'ok');
  assert.ok(result.latencyMs >= 0);
});

test('checkTrueMoneyHealth handles HTTP 500 error from API', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: 'Internal Error' }),
  });

  const result = await checkTrueMoneyHealth('https://wallet.example.com', mockFetch);
  assert.equal(result.success, false);
  assert.equal(result.status, 'offline');
  assert.equal(result.statusCode, 500);
  assert.match(result.message, /HTTP 500/);
});

test('checkTrueMoneyHealth handles network timeout or fetch error gracefully', async () => {
  const mockFetch = async () => {
    const error = new Error('Connection refused');
    throw error;
  };

  const result = await checkTrueMoneyHealth('https://wallet.example.com', mockFetch);
  assert.equal(result.success, false);
  assert.equal(result.status, 'offline');
  assert.match(result.message, /Connection refused/);
});
