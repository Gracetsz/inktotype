'use client';
/**
 * 照片测试台 —— 内部工具，不进 sitemap、不做 SEO。
 *
 * 它的存在理由：审查报告里的 L0（20 张真实照片，成功率 >90% 才放行）
 * 是整个项目唯一能被否决的一步。管线搬进浏览器之后，产品自己就是测试台，
 * 不必再另跑一遍 Python 脚本。拖进一批照片，直接出成功率与失败字符分布。
 */
import { useCallback, useState } from 'react';
import { decodeImage, processPhoto, type CellSummary } from '@/lib/pipeline/client';
import { CHARS } from '@/lib/template';

interface Row {
  name: string;
  ok: number;
  total: number;
  failed: string[];
  weak: string[];
  ms: number;
  error?: string;
}

export default function TestBench() {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  const run = useCallback(async (files: FileList) => {
    const out: Row[] = [];
    for (const file of Array.from(files)) {
      setRunning(file.name);
      const t0 = performance.now();
      try {
        const img = await decodeImage(file);
        const r = await processPhoto(img);
        const failed = r.cells.filter((c: CellSummary) => c.status !== 'ok').map((c) => c.char);
        const weak = r.cells.filter((c: CellSummary) => c.status === 'ok' && c.confidence < 0.45).map((c) => c.char);
        out.push({ name: file.name, ok: r.cells.length - failed.length, total: r.cells.length, failed, weak, ms: r.ms });
      } catch (e: any) {
        out.push({
          name: file.name, ok: 0, total: CHARS.length, failed: [], weak: [],
          ms: Math.round(performance.now() - t0),
          error: e?.needsManualCorners ? '需手动四角（自检拦截）' : (e?.message ?? String(e)),
        });
      }
      setRows([...out]);
    }
    setRunning(null);
  }, []);

  const done = rows.filter((r) => !r.error);
  const rate = done.length
    ? (done.reduce((s, r) => s + r.ok, 0) / done.reduce((s, r) => s + r.total, 0)) * 100
    : 0;
  const passRate = rows.length ? (rows.filter((r) => !r.error && r.ok === r.total).length / rows.length) * 100 : 0;

  const exportCsv = () => {
    const head = 'file,ok,total,rate,ms,failed,weak,error';
    const body = rows.map((r) =>
      [r.name, r.ok, r.total, (r.ok / r.total).toFixed(4), r.ms, `"${r.failed.join('')}"`, `"${r.weak.join('')}"`, `"${r.error ?? ''}"`].join(','),
    );
    const blob = new Blob([[head, ...body].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'photo-test-results.csv';
    a.click();
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Photo test bench</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        内部工具。拖入一批真实照片，逐张跑完整管线并统计成功率。
        <b className="text-ink"> 判据：整体切格成功率 ≥ 90% 才放行建站的其余部分。</b>
      </p>

      <div className="mt-5 rounded-2xl border border-brand-mid bg-brand-light p-5 text-sm">
        <p className="font-semibold text-brand">测之前先做两个分离实验，省得把三类问题混在一起</p>
        <ol className="mt-2 space-y-1.5 text-gray-700">
          <li>
            <b>① 代码对不对</b>：把 <code className="rounded bg-white px-1.5 py-0.5 text-xs">scripts/fixtures/76_*.jpg</code> 三张合成图拖进来。
            应当全部 76/76。不是的话问题在浏览器端，与你的笔迹无关。
          </li>
          <li>
            <b>② 打印对不对</b>：把<b>还没写字的空白模板</b>拍一张拖进来。
            正确结果是「切格 0/76、失败字符列出全部 76 个」——这说明<b>四角标记找到了</b>，只是格子是空的。
            若报「找不到定位标记」，那是打印或拍照的问题，先修这个再写字。
          </li>
          <li><b>③ 笔迹对不对</b>：以上两条都过了，再拖写好的照片。这时的失败才真正是笔迹造成的。</li>
        </ol>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-brand-mid bg-brand-light py-12 text-center hover:border-brand">
        <span className="text-lg font-semibold text-brand">选择多张照片</span>
        <span className="mt-1 text-sm text-gray-500">建议 5 个人书写 × 每张用 2–3 台手机在不同光线下重拍</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && run(e.target.files)} />
      </label>

      {running && <p className="mt-4 text-sm font-semibold text-brand">跑中：{running}…</p>}

      {rows.length > 0 && (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Stat label="逐格成功率" value={`${rate.toFixed(1)}%`} tone={rate >= 90 ? 'good' : 'bad'} />
            <Stat label="整张全对率" value={`${passRate.toFixed(0)}%`} tone={passRate >= 80 ? 'good' : 'warn'} />
            <Stat label="照片数" value={String(rows.length)} tone="plain" />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">文件</th><th className="px-4 py-3">切格</th>
                  <th className="px-4 py-3">耗时</th><th className="px-4 py-3">失败字符</th><th className="px-4 py-3">偏淡</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className="px-4 py-2.5">
                      {r.error
                        ? <span className="font-semibold text-red-600">✕</span>
                        : <span className={r.ok === r.total ? 'font-semibold text-green-600' : 'font-semibold text-amber-600'}>{r.ok}/{r.total}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{r.ms} ms</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-red-600">{r.error ?? r.failed.join(' ')}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-amber-600">{r.weak.join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={exportCsv} className="mt-5 rounded-xl bg-brand-light px-5 py-3 text-sm font-semibold text-brand">
            导出 CSV
          </button>
        </>
      )}
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'plain' }) {
  const cls = tone === 'good' ? 'border-green-300 bg-green-50 text-green-700'
    : tone === 'warn' ? 'border-amber-300 bg-amber-50 text-amber-700'
      : tone === 'bad' ? 'border-red-300 bg-red-50 text-red-700'
        : 'border-gray-200 bg-white text-ink';
  return (
    <div className={`rounded-2xl border p-5 ${cls}`}>
      <p className="text-xs font-semibold uppercase opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
