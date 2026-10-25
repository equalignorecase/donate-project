const test = require('node:test');
const assert = require('node:assert/strict');
const { containsProfanity, maskProfanity } = require('../lib/profanity.ts');

test('detects direct Thai profanities in names and messages', () => {
  assert.equal(containsProfanity('นายควย สวยงาม'), true);
  assert.equal(containsProfanity('สวัสดีไอ้เหี้ย'), true);
  assert.equal(containsProfanity('ไอ้สัสเอ้ย'), true);
  assert.equal(containsProfanity('ไปตายซะอีสัตว์นรก'), true);
  assert.equal(containsProfanity('เย็ดแม่'), true);
  assert.equal(containsProfanity('กะหรี่'), true);
  assert.equal(containsProfanity('ดอกทอง'), true);
});

test('detects user extended profanity list', () => {
  const sampleWords = [
    'ไอ้ควย', 'อีควย', 'ไอ้เหี้ย', 'อีเหี้ย', 'หัวควย', 'ควยเอ้ย', 'ควยแม่ง',
    'เย็ดเข้', 'เย็ดเป็ด', 'พ่อง', 'พ่อมึงตาย', 'แม่มึงตาย', 'ส้นตีน', 'หน้าส้นตีน',
    'คอวอโย', 'กาก', 'กระจอก', 'ชิบหาย', 'ฉิบหาย', 'ตอแหล', 'สันดานเสีย',
    'จิ๋ม', 'จู๋', 'ชักว่าว', 'น้ำเงี่ยน', 'แตกใน', 'สัสดี', 'สาส', 'สัด',
    'ไปตายห่า', 'ตายห่า', 'ฟักยู', 'motherfucker'
  ];
  for (const w of sampleWords) {
    assert.equal(containsProfanity(`ขอทดสอบ ${w} นะครับ`), true, `Should detect "${w}"`);
  }
});

test('detects acronyms and evasive slurs without catching normal words', () => {
  assert.equal(containsProfanity('อห 555'), true);
  assert.equal(containsProfanity('อส มึงดูดิ'), true);
  assert.equal(containsProfanity('อสังหาริมทรัพย์'), false);
  assert.equal(containsProfanity('อสมท'), false);
});

test('detects evasive and spaced out Thai profanities', () => {
  assert.equal(containsProfanity('ค ว ย'), true);
  assert.equal(containsProfanity('ค.ว.ย'), true);
  assert.equal(containsProfanity('ค-ว-ย'), true);
  assert.equal(containsProfanity('ค_ว_ย'), true);
  assert.equal(containsProfanity('ค*ย'), true);
  assert.equal(containsProfanity('เ หี้ ย'), true);
  assert.equal(containsProfanity('สั ส'), true);
  assert.equal(containsProfanity('สัx'), true);
  assert.equal(containsProfanity('หี'), true);
  assert.equal(containsProfanity('แ ต ด'), true);
});

test('detects English profanities and leetspeak', () => {
  assert.equal(containsProfanity('Hello fucker'), true);
  assert.equal(containsProfanity('what the fuck'), true);
  assert.equal(containsProfanity('f u c k'), true);
  assert.equal(containsProfanity('piece of shit'), true);
  assert.equal(containsProfanity('bitch please'), true);
  assert.equal(containsProfanity('asshole'), true);
  assert.equal(containsProfanity('f*ck'), true);
  assert.equal(containsProfanity('fck'), true);
});

test('does NOT trigger false positives on innocent Thai or English words', () => {
  assert.equal(containsProfanity('ความรักและความหวัง'), false);
  assert.equal(containsProfanity('ควบคุมดูแลระบบ'), false);
  assert.equal(containsProfanity('คนสวย รวยน้ำใจ'), false);
  assert.equal(containsProfanity('สวัสดีครับ ขอเป็นกำลังใจให้'), false);
  assert.equal(containsProfanity('ผู้จัดการร้าน'), false);
  assert.equal(containsProfanity('classic music'), false);
  assert.equal(containsProfanity('virtual assistant'), false);
  assert.equal(containsProfanity('passion for coding'), false);
  assert.equal(containsProfanity('สัตว์เลี้ยงน่ารักมาก'), false);
  assert.equal(containsProfanity('ไปเที่ยวสวนสัตว์กัน'), false);
  assert.equal(containsProfanity('คนรักสัตว์'), false);
  assert.equal(containsProfanity('สัตว์จรจัด'), false);
  assert.equal(containsProfanity('เยส ชนะแล้ว ยินดีด้วยครับ'), false);
  assert.equal(containsProfanity(''), false);
  assert.equal(containsProfanity('   '), false);
});

test('supports custom blacklist words from admin DB', () => {
  const customList = ['คำห้ามเฉพาะกิจ', 'เว็บพนัน888', 'badvendor'];
  assert.equal(containsProfanity('ขอแนะนำ เว็บพนัน888 นะครับ', customList), true);
  assert.equal(containsProfanity('ติดต่อ badvendor ด่วน', customList), true);
  assert.equal(containsProfanity('คำห้ามเฉพาะกิจ', customList), true);
  assert.equal(containsProfanity('เว็บทั่วไป 999', customList), false);
});

test('masks vulgar terms with asterisks', () => {
  const masked1 = maskProfanity('สวัสดีไอ้เหี้ย สบายดีไหม');
  assert.ok(!masked1.includes('เหี้ย'));
  assert.ok(masked1.includes('***'));

  const masked2 = maskProfanity('นาย ควย');
  assert.ok(!masked2.includes('ควย'));
  assert.ok(masked2.includes('***'));

  const masked3 = maskProfanity('what the fuck man');
  assert.ok(!masked3.includes('fuck'));
  assert.ok(masked3.includes('****'));
});
