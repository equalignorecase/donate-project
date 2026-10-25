const test = require('node:test');
const assert = require('node:assert/strict');
const { prepareTtsText } = require('../lib/tts-helper.ts');

test('spaces out unpronounceable consonant clusters like Zzzz so TTS can spell them', () => {
  assert.equal(prepareTtsText('Zzzz'), 'Z z z z');
  assert.equal(prepareTtsText('zzzz'), 'z z z z');
  assert.equal(prepareTtsText('xxx'), 'x x x');
  assert.equal(prepareTtsText('wtf'), 'w t f');
  assert.equal(prepareTtsText('Zzzz โดเนทให้ สองร้อยบาท ค่าตี๋น้อย'), 'Z z z z โดเนทให้ สองร้อยบาท ค่าตี๋น้อย');
});

test('leaves normal Thai and English names and messages intact', () => {
  assert.equal(prepareTtsText('John'), 'John');
  assert.equal(prepareTtsText('David'), 'David');
  assert.equal(prepareTtsText('สมชายใจดี'), 'สมชายใจดี');
  assert.equal(prepareTtsText('ขอบคุณมากครับ'), 'ขอบคุณมากครับ');
  assert.equal(prepareTtsText('5555'), '5555');
  assert.equal(prepareTtsText(''), '');
});
