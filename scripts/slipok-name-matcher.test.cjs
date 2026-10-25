const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

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

const { isThaiNameMatch } = require('../lib/services/slipok.ts');

test('isThaiNameMatch correctly verifies user specific case (นัฐพงษ์ น vs นัฐพงษ์ นาคอ่วม)', () => {
  assert.equal(isThaiNameMatch('นัฐพงษ์ น', 'นัฐพงษ์ นาคอ่วม'), true);
  assert.equal(isThaiNameMatch('นัฐพงษ์ น.', 'นัฐพงษ์ นาคอ่วม'), true);
  assert.equal(isThaiNameMatch('นาย นัฐพงษ์ น.', 'นัฐพงษ์ นาคอ่วม'), true);
  assert.equal(isThaiNameMatch('นาย นัฐพงษ์ น', 'นาย นัฐพงษ์ นาคอ่วม'), true);
  assert.equal(isThaiNameMatch('นัฐพงษ์ นาคอ่วม', 'นัฐพงษ์ นาคอ่วม'), true);
  assert.equal(isThaiNameMatch('นัฐพงษ์ นาค***', 'นัฐพงษ์ นาคอ่วม'), true);
  assert.equal(isThaiNameMatch('นัฐพงษ์', 'นัฐพงษ์ นาคอ่วม'), true);
});

test('isThaiNameMatch supports English Romanized bank slips', () => {
  assert.equal(isThaiNameMatch('Nattapong N', 'Nattapong Nakuam'), true);
  assert.equal(isThaiNameMatch('MR. NATTAPONG N.', 'Nattapong Nakuam'), true);
  assert.equal(isThaiNameMatch('Nattapong Nakuam', 'Nattapong Nakuam'), true);
});

test('isThaiNameMatch rejects mismatched names and wrong receivers', () => {
  // Completely different first name
  assert.equal(isThaiNameMatch('สมชาย ว', 'นัฐพงษ์ นาคอ่วม'), false);
  assert.equal(isThaiNameMatch('กมลวรรณ น', 'นัฐพงษ์ นาคอ่วม'), false);

  // Same first name, but completely different last name initial
  assert.equal(isThaiNameMatch('นัฐพงษ์ สมบูรณ์', 'นัฐพงษ์ นาคอ่วม'), false);
  assert.equal(isThaiNameMatch('นัฐพงษ์ ส', 'นัฐพงษ์ นาคอ่วม'), false);
  assert.equal(isThaiNameMatch('นัฐพงษ์ ก.', 'นัฐพงษ์ นาคอ่วม'), false);
});
