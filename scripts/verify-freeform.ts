/** 用真实白纸照片跑白纸流程，逐行核对字符分配与基线 */
import fs from 'fs';
import { segmentFreeform, freeformCharToPath, DEFAULT_ROWS } from '../lib/pipeline/freeform';
import { buildFont } from '../lib/pipeline/pipeline';
import { toGray } from '../lib/pipeline/imgops';
const jpeg = require('jpeg-js');

const file = process.argv[2] ?? 'scripts/fixtures/plain.jpg';
const raw = jpeg.decode(fs.readFileSync(file), { useTArray: true });
const gray = toGray(raw.data, raw.width, raw.height);
console.log(`照片 ${raw.width}×${raw.height}`);

const rowsArg = process.argv[3];
const rows = rowsArg ? rowsArg.split('|') : DEFAULT_ROWS;
const t0 = Date.now();
const r = segmentFreeform(gray, raw.width, raw.height, { rows });
console.log(`切分 ${Date.now() - t0}ms  共 ${r.chars.length} 个字符  x-height 基准 ${r.scaleBasis.toFixed(0)}px\n`);

console.log('行  期望/检出  基线y   上下边界      字符');
for (const row of r.rows) {
  const flag = row.found === row.expected ? '✅' : '⚠️ ';
  console.log(`${row.index}  ${flag}${String(row.expected).padStart(2)}/${String(row.found).padEnd(3)} ${String(Math.round(row.baseline)).padStart(6)}  ${String(row.top).padStart(5)}–${String(row.bottom).padEnd(5)}  ${row.chars.map(c=>c.char).join('')}`);
}

const glyphs: any[] = [];
for (const c of r.chars) {
  const p = freeformCharToPath(c, r.scaleBasis);
  if (p) glyphs.push({ char: c.char, path: p.path, advance: p.advance });
}
const ttf = Buffer.from(buildFont(glyphs, 'FreeformTest').toArrayBuffer());
fs.writeFileSync('scripts/fixtures/freeform.ttf', ttf);
console.log(`\n字形 ${glyphs.length} 个 -> freeform.ttf ${(ttf.length/1024).toFixed(1)}KB  总耗时 ${Date.now()-t0}ms`);
