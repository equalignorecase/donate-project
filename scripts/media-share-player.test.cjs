const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Run the component effects with a controlled clock and YouTube API boundary.
async function mountPlayer(volume = 70, apiBlocked = false) {
  const effects = [];
  const states = [];
  const timers = new Map();
  const players = [];
  let timerId = 0;
  let ended = 0;
  const children = [];
  const host = { style: {}, appendChild(child) { children.push(child); }, innerHTML: '' };
  const react = {
    useCallback: (fn) => fn,
    useEffect: (fn) => effects.push(fn),
    useRef: (value) => ({ current: value }),
    useState(value) {
      const index = states.push(value) - 1;
      return [value, (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    },
  };
  const window = {
    location: { origin: 'http://localhost:3000' },
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    setInterval: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
    clearInterval: (id) => timers.delete(id),
    addEventListener() {}, removeEventListener() {},
    YT: { Player: function (slot, options) {
      const player = {
        options, plays: 0, muted: false, state: -1, destroyed: false,
        playVideo() { this.plays++; },
        mute() { this.muted = true; },
        unMute() { this.muted = false; },
        setVolume(value) { this.volume = value; },
        getPlayerState() { return this.state; },
        getIframe() { return { setAttribute() {} }; },
        destroy() { this.destroyed = true; },
      };
      players.push(player);
      return player;
    } },
  };
  if (apiBlocked) window.YT = undefined;
  const mediaShare = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../lib/media-share.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports: mediaShare.exports, URL, URLSearchParams });
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(require.resolve('../app/overlay/MediaSharePlayer.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports, window,
    document: {
      createElement: () => ({ style: {}, setAttribute() {} }),
      querySelector: () => null,
      head: { appendChild: (script) => script.onerror() },
    },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => {
        if (props.ref) props.ref.current = host;
        return { type, props };
      }, jsxs: (type, props) => ({ type, props }) };
      if (name === 'lucide-react') return {};
      if (name === '@/lib/media-share') return mediaShare.exports;
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  module.exports.default({
    media: { id: 'test', donation: { amount: 50 }, parsed: { videoId: 'dQw4w9WgXcQ', startSeconds: 0 }, maxDuration: 60, volume },
    onEnded: () => ended++,
  });
  const cleanups = effects.map((effect) => effect());
  await Promise.resolve();
  await Promise.resolve();
  return { players, states, timers, children, get ended() { return ended; }, cleanup: () => cleanups.forEach((fn) => fn?.()) };
}

test('blocked audible autoplay retries muted on the same player without a click', async () => {
  const view = await mountPlayer();
  const player = view.players[0];
  player.options.events.onReady({ target: player });
  assert.equal(player.volume, 70);
  assert.equal(player.muted, false);
  assert.equal(typeof player.options.events.onAutoplayBlocked, 'function');
  player.options.events.onAutoplayBlocked({ target: player });
  assert.equal(player.muted, true);
  assert.equal(player.plays, 2);
  assert.equal(view.players.length, 1);
  assert.equal(player.destroyed, false);
  assert.equal(view.ended, 0);
  player.options.events.onStateChange({ target: player, data: 1 });
  assert.equal(view.timers.size, 1, 'only the playback countdown remains');
  view.cleanup();
  assert.equal(view.timers.size, 0);
});

test('slow buffering does not destroy or mute a player that has not been blocked', async () => {
  const view = await mountPlayer();
  const player = view.players[0];
  player.options.events.onReady({ target: player });
  player.state = 3;
  player.options.events.onStateChange({ target: player, data: 3 });
  for (const [id, timer] of [...view.timers]) {
    if (timer.delay < 15000) { view.timers.delete(id); timer.fn(); }
  }
  assert.equal(view.players.length, 1);
  assert.equal(player.destroyed, false);
  assert.equal(player.muted, false);
  view.cleanup();
});

test('blocking even muted playback shows a manual hint without a retry loop', async () => {
  const view = await mountPlayer(0);
  const player = view.players[0];
  player.options.events.onReady({ target: player });
  assert.equal(typeof player.options.events.onAutoplayBlocked, 'function');
  player.options.events.onAutoplayBlocked({ target: player });
  assert.equal(view.states[2], true);
  assert.equal(player.plays, 1);
  view.cleanup();
  player.options.events.onAutoplayBlocked({ target: player });
  assert.equal(player.plays, 1);
});

test('API failure preserves audible autoplay instead of forcing the fallback iframe silent', async () => {
  const view = await mountPlayer(70, true);
  const url = new URL(view.children[0].src);
  assert.equal(url.searchParams.get('autoplay'), '1');
  assert.equal(url.searchParams.get('mute'), '0');
  assert.equal(view.states[1], false);
  view.cleanup();
});

test('API failure still honors an intentionally muted volume setting', async () => {
  const view = await mountPlayer(0, true);
  const url = new URL(view.children[0].src);
  assert.equal(url.searchParams.get('mute'), '1');
  view.cleanup();
});
