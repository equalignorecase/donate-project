/**
 * Converts numeric amount to natural Thai currency speech text.
 * e.g. 1000 -> 'หนึ่งพันบาท'
 *      1001 -> 'หนึ่งพันเอ็ดบาท'
 *      50.5 -> 'ห้าสิบบาท ห้าสิบสตางค์'
 */
export function amountToThaiWords(amount: number | string): string {
  const num = parseFloat(String(amount));
  if (isNaN(num) || num <= 0) return 'ศูนย์บาท';

  const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function toWords(intStr: string): string {
    let res = '';
    const len = intStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(intStr[i], 10);
      const place = len - 1 - i;
      if (digit === 0) continue;
      if (place === 1 && digit === 1) {
        res += 'สิบ';
      } else if (place === 1 && digit === 2) {
        res += 'ยี่สิบ';
      } else if (place === 0 && digit === 1 && len > 1) {
        res += 'เอ็ด';
      } else {
        res += units[digit] + places[place];
      }
    }
    return res;
  }

  const intPart = Math.floor(num);
  const fracPart = Math.round((num - intPart) * 100);

  let thaiText = '';
  if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    const rem = intPart % 1000000;
    thaiText = toWords(millions.toString()) + 'ล้าน' + (rem > 0 ? toWords(rem.toString()) : '');
  } else {
    thaiText = toWords(intPart.toString());
  }

  thaiText += 'บาท';
  if (fracPart > 0) {
    thaiText += ' ' + toWords(fracPart.toString()) + 'สตางค์';
  }
  return thaiText;
}
