import fs from 'fs';
import { rectify, segmentCell } from '../lib/pipeline/pipeline';
import { toGray } from '../lib/pipeline/imgops';
import { buildLayout } from '../lib/template';
const jpeg = require('jpeg-js');
const layout = buildLayout();
const raw = jpeg.decode(fs.readFileSync('scripts/fixtures/76_hard.jpg'), { useTArray: true });
const rect = rectify(toGray(raw.data, raw.width, raw.height), raw.width, raw.height);
for (const ch of ["'", '"', '.', '-']) {
  const seg = segmentCell(rect, layout.cells[ch]);
  // 逐连通域列出包围盒
  const { mask, w, h } = seg;
  const seen = new Int32Array(w * h).fill(-1); const boxes: number[][] = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i] >= 0) continue;
    const st = [i]; seen[i] = boxes.length;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, n = 0;
    while (st.length) {
      const p = st.pop()!; const px = p % w, py = (p / w) | 0; n++;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (mask[q] && seen[q] < 0) { seen[q] = boxes.length; st.push(q); }
      }
    }
    boxes.push([x0, y0, x1 - x0 + 1, y1 - y0 + 1, n]);
  }
  console.log(`${ch}  格 ${w}x${h}  连通域 ${boxes.length} 个:`);
  boxes.sort((a, b) => b[4] - a[4]).forEach(([x, y, bw2, bh, n]) =>
    console.log(`     宽${String(bw2).padStart(4)} 高${String(bh).padStart(4)} 面积${String(n).padStart(6)} 位置(${x},${y})  宽高比 ${(bw2/bh).toFixed(1)}  占格宽 ${(bw2/w*100).toFixed(0)}%`));
}
