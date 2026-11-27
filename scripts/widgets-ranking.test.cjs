const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Compile the existing extensionless TypeScript imports for the Node test runner.
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(result.outputText, filename);
};
const { summarizeWidgets } = require('../lib/widgets.ts');

const rows = [
  { name: 'หนึ่ง', amount: 10, created_at: '2025-01-01T00:00:00Z' },
  { name: 'หนึ่ง', amount: 25, created_at: '2026-10-23T00:00:00Z' },
  { name: 'สอง', amount: 30, created_at: '2026-09-01T00:00:00Z' },
  { name: 'สาม', amount: 20, created_at: '2026-10-22T00:00:00Z' },
  { name: 'สี่', amount: 5, created_at: '2026-10-23T00:00:00Z' },
];
const now = new Date('2026-10-23T12:00:00Z');

test('donation page can request top three independently of the overlay limit', () => {
  const data = summarizeWidgets(rows, { supporter_limit: '1', goal_started_at: '2026-10-01T00:00:00Z', goal_target: '100' }, now, 3);
  assert.deepEqual(data.allTime, [{ name: 'หนึ่ง', amount: 35 }, { name: 'สอง', amount: 30 }, { name: 'สาม', amount: 20 }]);
  assert.equal(data.goal.current, 50);
  assert.equal(data.goal.target, 100);
});

test('existing overlay requests retain their configured limit', () => {
  assert.equal(summarizeWidgets(rows, { supporter_limit: '1' }, now).allTime.length, 1);
});

test('invalid limit overrides do not bypass the configured limit', () => {
  for (const limit of [0, -1, 1.5, 11, NaN]) {
    assert.equal(summarizeWidgets(rows, { supporter_limit: '1' }, now, limit).allTime.length, 1);
  }
});

test('goal_amount_offset and supporter_adjustments apply smart offset on top of real donations', () => {
  const adjustments = JSON.stringify({
    allTime: {
      'หนึ่ง': 100, // 35 + 100 = 135
      'สอง': -30,  // 30 - 30 = 0 (removed from ranking)
      'ห้า': 200,  // new manually added supporter = 200
    },
  });
  const data = summarizeWidgets(
    rows,
    {
      supporter_limit: '5',
      goal_started_at: '2026-10-01T00:00:00Z',
      goal_target: '500',
      goal_amount_offset: '150',
      supporter_adjustments: adjustments,
    },
    now
  );
  assert.equal(data.goal.rawCurrent, 50);
  assert.equal(data.goal.offset, 150);
  assert.equal(data.goal.current, 200);
  assert.deepEqual(data.allTime, [
    { name: 'ห้า', amount: 200 },
    { name: 'หนึ่ง', amount: 135 },
    { name: 'สาม', amount: 20 },
    { name: 'สี่', amount: 5 },
  ]);
});
