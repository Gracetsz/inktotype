/**
 * 白纸流程回归：三张真实照片，每次改算法都跑一遍。
 *
 * 断言分两层，第二层是被真实 bug 逼出来的：
 *
 *   1. **字符数量对不对** —— 原本只有这一层
 *   2. **多部件字符的部件数对不对** —— 新增
 *
 * 为什么必须有第二层：`:` 丢掉一个点的时候，第一层是**全绿**的。
 * 分组算法会把剩下的连通域强行凑成期望的字符数，界面照样显示「14 found / 14 expected」。
 * 这正是 `/font-from-image/` 页面上警告用户的那种错误 ——
 * 「绿色的数字只说明数量对，不代表对得上」。
 * 回归自己犯同一个错误就没有意义了。
 */
import fs from 'fs';
import { segmentFreeform } from '../lib/pipeline/freeform';
import { toGray } from '../lib/pipeline/imgops';
const jpeg = require('jpeg-js');

/**
 * 判据用「墨量下限」，不用「连通块个数」。
 *
 * 一开始写的是数连通块：`:` 应该有 2 块、`i` 应该有 2 块。
 * 结果在真实照片上误报两个 —— `i` 的点和竖写得挨太近、被形态学闭运算连成一体，
 * `"` 两撇本来就写在一起。两者的部件都在，只是连着。
 *
 * **连通块个数分不清「部件丢了」和「部件挨着写」**，而后者是手写的常态。
 * 墨量只对前者敏感：丢一个点，墨量掉三成；两笔连在一起，墨量不变。
 *
 * 下限存在 fixture 的 minInk 里，取当前正确值的 65%。
 * 算法有意改动导致墨量变化时，这个数要跟着更新 —— 那正是应该停下来看一眼的时刻。
 */
function inkOf(mask: Uint8ClampedArray) {
  let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) n++;
  return n;
}

const cases = JSON.parse(fs.readFileSync('scripts/fixtures/regression.json', 'utf8'));
let fail = 0;
for (const [file, c] of Object.entries<any>(cases)) {
  const raw = jpeg.decode(fs.readFileSync(`scripts/fixtures/${file}`), { useTArray: true });
  const t0 = Date.now();
  try {
    const r = segmentFreeform(toGray(raw.data, raw.width, raw.height), raw.width, raw.height, { rows: c.rows });
    const allMatch = r.rows.every((x) => x.found === x.expected);
    const okChars = r.chars.length === c.expect.chars;

    // 第二层：多部件字符的墨量不得低于下限
    const partIssues: string[] = [];
    for (const ch of r.chars as any[]) {
      const floor = c.minInk?.[ch.char];
      if (floor == null) continue;
      const got = inkOf(ch.mask);
      if (got < floor) partIssues.push(`${ch.char}=${got}<${floor}`);
    }

    const ok = allMatch === c.expect.allRowsMatch && okChars && partIssues.length === 0;
    if (!ok) fail++;
    console.log(`${ok ? '✅' : '❌'} ${file}  ${r.chars.length}/${c.expect.chars} 字符  ${r.rows.length} 行 ${allMatch ? '全对' : '有不符'}  ${Date.now() - t0}ms`);
    console.log(`   ${c.note}`);
    if (partIssues.length) console.log(`   ⚠️ 墨量低于下限（多半是某个部件被滤掉了）: ${partIssues.join('  ')}`);
    if (!ok) r.rows.forEach((x) => console.log(`     行${x.index}: ${x.found}/${x.expected}`));
  } catch (e: any) { fail++; console.log(`❌ ${file}  ${e.message}`); }
}
console.log(fail ? `\n${fail} 个用例失败` : '\n全部通过');
process.exit(fail ? 1 : 0);
