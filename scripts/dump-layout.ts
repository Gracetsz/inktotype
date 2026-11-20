// 把 TS 里的模板几何导出成 JSON，供 Python 模拟器使用 —— 保证两边同源
import fs from 'fs';
import { buildLayout, CHARS, anchorOf, minAreaOf, TPL } from '../lib/template';
const l = buildLayout();
const out = {
  W: l.W, H: l.H, mark: l.mark, pad: l.pad, cols: TPL.COLS, rows: TPL.ROWS,
  cells: Object.fromEntries(CHARS.map((ch) => [ch, {
    ...l.cells[ch], anchor: anchorOf(ch), minArea: minAreaOf(ch),
  }])),
};
fs.writeFileSync('scripts/layout76.json', JSON.stringify(out, null, 1));
console.log(`76 格布局已导出：${Object.keys(out.cells).length} 个字符, ${TPL.COLS}列×${TPL.ROWS}行`);
