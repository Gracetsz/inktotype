import fs from 'fs';
import { segmentFreeform } from '../lib/pipeline/freeform';
import { toGray } from '../lib/pipeline/imgops';
const jpeg = require('jpeg-js');
const raw = jpeg.decode(fs.readFileSync('scripts/fixtures/plain.jpg'), { useTArray: true });
const gray = toGray(raw.data, raw.width, raw.height);
// 故意给每行一串占位符，只为看分组结果，不做真实分配
const r = segmentFreeform(gray, raw.width, raw.height, {
  rows: ['x'.repeat(40), 'x'.repeat(40), 'x'.repeat(40), 'x'.repeat(40)],
});
for (const row of r.rows) {
  console.log(`\n行 ${row.index}  检出 ${row.found} 组  基线 ${Math.round(row.baseline)}  范围 ${row.top}-${row.bottom}`);
  const cs = row.chars;
  console.log('  ' + cs.map((c, i) => `#${i}(x${c.x0},w${c.w},h${c.h})`).join(' '));
}
