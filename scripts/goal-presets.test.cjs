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
const { goalAppearanceDefaults, validGoalAppearance, readGoalAppearance } = require('../lib/goalAppearance.ts');
const { applyGoalPreset } = require('../lib/goalPresets.ts');
const GoalWidget = require('../app/overlay/goal/GoalWidget.tsx').default;

test('presets produce valid settings that survive loading from saved settings', () => {
  for (const id of ['slim', 'capsule', 'segmented', 'hud', 'milestone', 'floating']) {
    const value = applyGoalPreset(goalAppearanceDefaults, id);
    for (const [key, setting] of Object.entries(value)) assert.ok(validGoalAppearance(key, setting), `${id}: ${key}`);
    assert.deepEqual(readGoalAppearance(value), value);
  }
});

test('choosing a preset retains custom colors, font, width and the deadline', () => {
  const original = { ...goalAppearanceDefaults, goal_bar_color: '#ff1234', goal_bar_end_color: '#112233', goal_gradient: 'true', goal_width: '800', goal_end_date: '2026-12-31T00:00:00Z' };
  for (const id of ['slim', 'capsule', 'segmented', 'hud', 'milestone', 'floating']) {
    const value = applyGoalPreset(original, id);
    for (const key of ['goal_bar_color', 'goal_bar_end_color', 'goal_gradient', 'goal_width', 'goal_font', 'goal_end_date']) assert.equal(value[key], original[key]);
  }
  assert.equal(original.goal_bar_style, 'minimal');
});

test('Slim is a flat thin bar with amounts below it and no inside text', () => {
  const appearance = applyGoalPreset(goalAppearanceDefaults, 'slim');
  const html = renderToStaticMarkup(React.createElement(GoalWidget, { title: 'ค่าเกม', current: 250, target: 1000, appearance }));
  assert.match(html, /height:12px/);
  assert.match(html, /padding:0/);
  assert.match(html, /box-shadow:none/);
  assert.ok(html.indexOf('goal-track-slim') < html.indexOf('goal-values'));
  assert.match(html, /฿250/);
  assert.match(html, /25\.0%/);
  assert.doesNotMatch(html, /class="goal-bar-percent"/);
});

test('Capsule displays the amount inside the bar with its optional shine', () => {
  const appearance = applyGoalPreset(goalAppearanceDefaults, 'capsule');
  const html = renderToStaticMarkup(React.createElement(GoalWidget, { title: 'ค่าเกม', current: 250, target: 1000, appearance }));
  assert.match(html, /goal-track-glass/);
  assert.match(html, /class="goal-bar-percent"/);
  assert.match(html, /goal-bar-shine-sweep/);
});

test('Segmented renders actual gaps, with progress bounded at zero and full', () => {
  const appearance = applyGoalPreset(goalAppearanceDefaults, 'segmented');
  for (const [current, expected] of [[0, '0'], [1500, '100']]) {
    const html = renderToStaticMarkup(React.createElement(GoalWidget, { title: 'ค่าเกม', current, target: 1000, appearance }));
    assert.match(html, /goal-track-segmented/);
    assert.match(html, /mask-image:repeating-linear-gradient/);
    assert.ok(html.includes(`width:${expected}%`));
    assert.ok(html.indexOf('goal-track-segmented') < html.indexOf('goal-values'));
  }
});

test('existing saved styles remain valid and keep their previous bar layout', () => {
  for (const style of ['minimal', 'glass', 'neon', 'striped']) {
    assert.ok(validGoalAppearance('goal_bar_style', style));
    const appearance = readGoalAppearance({ ...goalAppearanceDefaults, goal_bar_style: style });
    const html = renderToStaticMarkup(React.createElement(GoalWidget, { title: 'ค่าเกม', current: 250, target: 1000, appearance }));
    assert.ok(html.includes(`goal-track-${style}`));
    assert.match(html, /height:48px/);
    assert.match(html, /class="goal-bar-percent"/);
  }
});

test('HUD renders an angular frame and a header percentage, with optional glow', () => {
  const appearance = applyGoalPreset(goalAppearanceDefaults, 'hud');
  const render = (value) => renderToStaticMarkup(React.createElement(GoalWidget, { title: 'ค่าเกม', current: 250, target: 1000, appearance: value }));
  const html = render(appearance);
  assert.match(html, /goal-track-hud/);
  assert.match(html, /goal-hud-frame/);
  assert.match(html, /goal-hud-percent/);
  assert.match(html, /25\.0%/);
  assert.match(html, /drop-shadow/);
  assert.doesNotMatch(render({ ...appearance, goal_bar_shine: 'false' }), /drop-shadow/);
});

test('Milestone lights only checkpoints already passed, including the exact boundary', () => {
  const appearance = applyGoalPreset(goalAppearanceDefaults, 'milestone');
  for (const [current, reached] of [[0, 0], [249, 0], [250, 1], [500, 2], [750, 3], [1500, 4]]) {
    const html = renderToStaticMarkup(React.createElement(GoalWidget, { title: 'ค่าเกม', current, target: 1000, appearance }));
    assert.match(html, /goal-track-milestone/);
    assert.equal((html.match(/data-reached="true"/g) || []).length, reached);
    assert.equal((html.match(/class="goal-checkpoint"/g) || []).length, 4);
  }
});

test('Floating Label follows bounded progress and clamps its position inside the bar', () => {
  const appearance = applyGoalPreset(goalAppearanceDefaults, 'floating');
  for (const [current, expected] of [[0, 0], [500, 50], [1500, 100]]) {
    const html = renderToStaticMarkup(React.createElement(GoalWidget, { title: 'ค่าเกม', current, target: 1000, appearance }));
    assert.match(html, /goal-floating-label/);
    assert.match(html, /left:clamp\(/);
    assert.ok(html.includes(`, ${expected}%,`));
    assert.ok(html.indexOf('goal-floating-label') < html.indexOf('goal-track-floating'));
    assert.match(html, /goal-floating-target/);
  }
});
