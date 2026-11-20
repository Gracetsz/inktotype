import fs from 'fs';
import { toGray, gaussianApprox, divide, otsu, thresholdInv, open, close } from '../lib/pipeline/imgops';
const jpeg = require('jpeg-js');
const raw = jpeg.decode(fs.readFileSync('scripts/fixtures/plain2.jpg'), { useTArray: true });
const w = raw.width, h = raw.height;
const gray = toGray(raw.data, w, h);
const bg = gaussianApprox(gray, w, h, Math.max(12, (45 * w) / 2480));
let bw = thresholdInv(divide(gray, bg), otsu(divide(gray, bg)));
bw = open(bw, w, h, 3); bw = close(bw, w, h, 5);
const proj = new Int32Array(h);
for (let y = 0; y < h; y++) { let n = 0; for (let x = 0; x < w; x++) if (bw[y * w + x]) n++; proj[y] = n; }
const peak = Math.max(...proj), thr = Math.max(2, peak * 0.02);
const bands: [number, number][] = []; let s = -1;
for (let y = 0; y < h; y++) {
  if (proj[y] > thr && s < 0) s = y; else if (proj[y] <= thr && s >= 0) { bands.push([s, y - 1]); s = -1; }
}
if (s >= 0) bands.push([s, h - 1]);
const hs = bands.map(([a, b]) => b - a).sort((a, b) => a - b);
const med = hs[hs.length >> 1];
console.log(`图 ${w}x${h}  峰值 ${peak}  阈值 ${thr.toFixed(0)}  原始带 ${bands.length} 条  中位高 ${med}`);
bands.forEach(([a, b], i) => {
  const gap = i ? a - bands[i - 1][1] : 0;
  console.log(`  #${i}  ${String(a).padStart(5)}-${String(b).padStart(5)}  高 ${String(b - a).padStart(4)}  与上带间距 ${String(gap).padStart(4)}  ${gap && gap < med * 0.45 ? '← 会被合并' : ''}`);
});
