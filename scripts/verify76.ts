/** 用前端同一份管线代码跑 76 格模拟照片。Node 只负责解码，算法零改动。 */
import fs from 'fs';
import { rectify, segmentCell, cellToPath, measureInk, buildFont, type CellResult } from '../lib/pipeline/pipeline';
import { toGray } from '../lib/pipeline/imgops';
import { buildLayout, CHARS, PUNCT, minAreaOf } from '../lib/template';
const jpeg = require('jpeg-js');

const layout = buildLayout();
const files = fs.readdirSync('scripts/fixtures').filter((f) => f.startsWith('76_') && f.endsWith('.jpg')).sort();
console.log('用例            切格     标点     耗时    失败字符');
console.log('-'.repeat(70));
for (const file of files) {
  const t0 = Date.now();
  try {
    const raw = jpeg.decode(fs.readFileSync(`scripts/fixtures/${file}`), { useTArray: true });
    const gray = toGray(raw.data, raw.width, raw.height);
    const rect = rectify(gray, raw.width, raw.height);
    const glyphs: any[] = []; const failed: string[] = [];
    let punctOk = 0;
    // 先量真实墨迹度量，再生成字形 —— 与 worker 里的顺序一致
    const segs = new Map<string, CellResult>();
    for (const ch of CHARS) segs.set(ch, segmentCell(rect, layout.cells[ch]));
    const ink = measureInk(segs, layout);
    for (const ch of CHARS) {
      const seg = segs.get(ch)!;
      if (seg.status !== 'ok') { failed.push(ch); continue; }
      const r = cellToPath(seg, layout.cells[ch], ink);
      if (!r) { failed.push(ch); continue; }
      glyphs.push({ char: ch, path: r.path, advance: r.advance });
      if (PUNCT.includes(ch)) punctOk++;
    }
    const ttf = Buffer.from(buildFont(glyphs, 'Test76').toArrayBuffer());
    fs.writeFileSync(`scripts/fixtures/${file.replace('.jpg', '.ttf')}`, ttf);
    const flag = glyphs.length === 76 ? '✅' : glyphs.length >= 72 ? '⚠️ ' : '❌';
    console.log(`${file.replace('.jpg','').padEnd(15)} ${flag}${String(glyphs.length+'/76').padEnd(7)} ${punctOk}/14   ${String(Date.now()-t0+'ms').padEnd(7)} ${failed.join(' ')}`);
  } catch (e: any) {
    console.log(`${file.replace('.jpg','').padEnd(15)} ❌  ${e.message}`);
  }
}
console.log('\n标点阈值分级:', PUNCT.map((c) => `${c}=${minAreaOf(c)}`).join(' '));
