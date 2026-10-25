import test from 'node:test';
import assert from 'node:assert/strict';
import { readDonationTheme, saveDonationTheme } from '../lib/donation-theme.ts';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('first visit or invalid preference follows the operating system', () => {
  const storage = memoryStorage();
  assert.equal(readDonationTheme(storage), null);
  storage.setItem('streamlove-theme', 'unknown');
  assert.equal(readDonationTheme(storage), null);
});

test('a chosen theme persists across later reads and can be switched back', () => {
  const storage = memoryStorage();
  saveDonationTheme('light', storage);
  assert.equal(readDonationTheme(storage), 'light');
  saveDonationTheme('dark', storage);
  assert.equal(readDonationTheme(storage), 'dark');
});

test('blocked storage keeps the toggle usable without throwing', () => {
  const storage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  assert.equal(readDonationTheme(storage), null);
  assert.doesNotThrow(() => saveDonationTheme('light', storage));
});
