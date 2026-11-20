import fs from 'fs';
import { segmentFreeform } from '../lib/pipeline/freeform';
import { toGray } from '../lib/pipeline/imgops';
const jpeg = require('jpeg-js');
const raw = jpeg.decode(fs.readFileSync('scripts/fixtures/plain.jpg'), { useTArray: true });
const r = segmentFreeform(toGray(raw.data, raw.width, raw.height), raw.width, raw.height, {
  rows: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz','0123456789',',;.""\',:-'],
});
const row = r.rows[1];
console.log(`行1 基线(页坐标) ${Math.round(row.baseline)}  带 ${row.top}-${row.bottom}  x-height基准 ${r.scaleBasis}px`);
console.log('字符  页y顶  页y底  高   本字基线  底距基线');
for (const c of row.chars) {
  const y1 = c.y0 + c.h;
  console.log(`  ${c.char}  ${String(c.y0).padStart(5)} ${String(y1).padStart(6)} ${String(c.h).padStart(4)}   ${String(Math.round(c.baseline)).padStart(6)} ${String(Math.round(c.baseline - y1)).padStart(6)}`);
}
