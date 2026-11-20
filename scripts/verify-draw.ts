/** 验证浏览器直写路径：掩膜 -> maskToPath -> TTF，几何是已知常数 */
import fs from 'fs';
import { maskToPath, XH, buildFont } from '../lib/pipeline/pipeline';
const { PNG } = require('pngjs');

const meta = JSON.parse(fs.readFileSync('scripts/fixtures/draw/meta.json', 'utf8'));
const s = XH / (meta.baseline - meta.xheight);
const glyphs: any[] = [];
const t0 = Date.now();
for (const ch of meta.chars as string[]) {
  const png = PNG.sync.read(fs.readFileSync(`scripts/fixtures/draw/${ch.charCodeAt(0)}.png`));
  const mask = new Uint8ClampedArray(png.width * png.height);
  for (let i = 0, j = 0; i < mask.length; i++, j += 4) mask[i] = png.data[j] < 160 ? 255 : 0;
  const p = maskToPath(mask, png.width, png.height, meta.baseline, s);
  if (p) glyphs.push({ char: ch, path: p.path, advance: p.advance });
}
const ttf = Buffer.from(buildFont(glyphs, 'DrawTest').toArrayBuffer());
fs.writeFileSync('scripts/fixtures/draw.ttf', ttf);
console.log(`直写路径: ${glyphs.length}/${meta.chars.length} 字形  ${Date.now()-t0}ms  ${(ttf.length/1024).toFixed(1)}KB`);
