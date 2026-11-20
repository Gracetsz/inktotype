'use client';
/**
 * 白纸手写照片 -> 字体。免打印路径。
 *
 * 与模板流程的唯一交互差异：用户必须告诉我们每行写了什么。
 * 这不是偷懒 —— 字符顺序正是让「无印刷基线也能定位基线」这件事成立的先验，
 * 而用户不一定按默认顺序写（实测第一张真实照片的标点行就和默认不一样）。
 * 所以行内容是可编辑的，且检出数与期望数不符时当场标红。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  decodeImage, processFreeform, buildFreeformFont, maskToCanvas, resetWorker,
  type FreeformRowSummary, type Progress,
} from '@/lib/pipeline/client';
import { track, EV } from '@/lib/analytics';
import WritingGuide from './WritingGuide';

const DEFAULT_ROWS = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  '.,!?\'"-():;&@#',
];

type Masks = Record<string, { mask: Uint8ClampedArray; w: number; h: number; baseTop: number }>;

export default function FromImageTool() {
  // 上传之前必须先过书写范本 —— 第一次真实测试就是因为没看范本而写错了标点行
  const [guideDone, setGuideDone] = useState(false);
  const [rows, setRows] = useState<string[]>(DEFAULT_ROWS);
  const [img, setImg] = useState<{ rgba: Uint8ClampedArray; width: number; height: number } | null>(null);
  const [result, setResult] = useState<FreeformRowSummary[] | null>(null);
  const [masks, setMasks] = useState<Masks>({});
  const [busy, setBusy] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ttf, setTtf] = useState<ArrayBuffer | null>(null);
  const [included, setIncluded] = useState<string[]>([]);
  const [fontName, setFontName] = useState('My Handwriting');
  const [sample, setSample] = useState('The quick brown fox jumps over 12 lazy dogs');
  const [ms, setMs] = useState(0);
  /** 基线到 x-height 的像素距离 —— 缩略图用它算全行统一比例 */
  const [scaleBasis, setScaleBasis] = useState(0);

  useEffect(() => {
    track(EV.createStarted, { route: 'freeform' });
    return () => resetWorker();
  }, []);

  const run = useCallback(async (
    image: { rgba: Uint8ClampedArray; width: number; height: number }, useRows: string[],
  ) => {
    setError(null); setTtf(null); setBusy({ phase: 'Finding lines of writing', done: 0, total: 1 });
    try {
      const r = await processFreeform(image, useRows.filter((x) => x.length), setBusy);
      setResult(r.rows); setMasks(r.masks); setMs(r.ms); setScaleBasis(r.scaleBasis);
      track(EV.photoProcessed, {
        route: 'freeform',
        ok: r.rows.filter((x) => x.found === x.expected).length,
        total: r.rows.length,
        ms: r.ms,
      });
    } catch (e: any) {
      setError(e?.message ?? String(e)); setResult(null);
    } finally { setBusy(null); }
  }, []);

  const onFile = useCallback(async (file: File) => {
    setError(null);
    track(EV.photoUploaded, { route: 'freeform', type: file.type, kb: Math.round(file.size / 1024) });
    try {
      setBusy({ phase: 'Reading the photo', done: 0, total: 1 });
      const image = await decodeImage(file);
      setImg(image);
      await run(image, rows);
    } catch (e: any) { setBusy(null); setError(e?.message ?? String(e)); }
  }, [rows, run]);

  const build = useCallback(async () => {
    setError(null); setBusy({ phase: 'Assembling the font', done: 0, total: 1 });
    try {
      const r = await buildFreeformFont(fontName, setBusy);
      setTtf(r.ttf); setIncluded(r.included);
      track(EV.fontBuilt, { route: 'freeform', chars: r.included.length });
      const face = new FontFace('InkPreviewFF', r.ttf);
      await face.load();
      (document.fonts as any).add(face);
    } catch (e: any) { setError(e?.message ?? String(e)); } finally { setBusy(null); }
  }, [fontName]);

  const download = () => {
    if (!ttf) return;
    track(EV.fontDownloaded, { route: 'freeform', chars: included.length, kb: Math.round(ttf.byteLength / 1024) });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ttf], { type: 'font/ttf' }));
    a.download = `${fontName.replace(/[^\w\-]+/g, '') || 'MyHandwriting'}.ttf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const allMatch = result?.every((r) => r.found === r.expected) ?? false;
  const total = result?.reduce((s, r) => s + r.chars.length, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight">Make a font from an image</h1>
      <p className="mt-3 max-w-2xl text-lg text-gray-600">
        No printer needed. Write the alphabet on a blank sheet — one group per line — photograph it,
        and get an installable TTF. Everything runs in your browser.
      </p>

      {!guideDone && (
        <div className="mt-8">
          <WritingGuide onAccept={() => setGuideDone(true)} />
        </div>
      )}

      {guideDone && (
        <>
      <section className="mt-8 rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold">1 · What did you write, line by line?</h2>
        <p className="mt-1 text-sm text-gray-500">
          Knowing the order is what lets us find the baseline without printed guides — edit these to match
          your sheet exactly. Add a line for every line you actually wrote, and put a{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs font-bold text-brand">~</code>{' '}
          wherever you crossed something out.
        </p>
        <div className="mt-4 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs font-semibold text-gray-400">Line {i + 1}</span>
              <input
                value={r}
                onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                className="flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-brand"
              />
              <span className="w-10 shrink-0 text-right text-xs text-gray-400">{[...r].length}</span>
              <button
                onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                disabled={rows.length <= 1}
                title="Remove this line"
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-gray-300 hover:text-red-500 disabled:opacity-30"
              >✕</button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setRows((p) => [...p, ''])}
          className="mt-3 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
        >
          + Add a line
        </button>
        {img && (
          <button onClick={() => run(img, rows)} disabled={!!busy}
            className="mt-4 rounded-xl bg-brand-light px-5 py-2.5 text-sm font-semibold text-brand disabled:opacity-50">
            {busy ? 'Working…' : 'Re-read with these lines'}
          </button>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-bold">2 · Your photo</h2>
        <label className="mt-3 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-brand-mid bg-brand-light py-14 text-center hover:border-brand">
          <span className="text-lg font-semibold text-brand">Choose photo</span>
          <span className="mt-1 text-sm text-gray-500">
            Dark pen on white paper · one group per line · leave a gap between lines
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      </section>
        </>
      )}

      {busy && (
        <div className="mt-6 rounded-2xl border border-brand-mid bg-brand-light p-5">
          <p className="text-sm font-semibold text-brand">{busy.phase}…</p>
        </div>
      )}
      {error && <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-800">{error}</div>}

      {result && !busy && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">3 · Review</h2>
              <p className="mt-1 text-gray-600">
                <b className="text-brand">{total}</b> characters found · read in {ms} ms
                {!allMatch && <span className="text-amber-600"> · some lines don&apos;t match — fix the text above and re-read</span>}
              </p>
            </div>
            <button onClick={build} disabled={!!busy}
              className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
              {busy ? 'Building…' : 'Build my font →'}
            </button>
          </div>

          {/* 同 CreateWizard：字符错配是静默的，只有肉眼扫一遍能抓到 */}
          <div className="mt-4 rounded-2xl border-2 border-brand bg-brand-light p-4">
            <p className="text-sm font-bold text-ink">Check each thumbnail against its label.</p>
            <p className="mt-1 text-sm text-gray-700">
              A green count only means we found the <i>right number</i> of characters — it can&apos;t tell
              whether they line up. If one mark was missed or one blob counted twice, every character after
              it shifts by one and each thumbnail carries the wrong label, silently. Scan each row once: the
              small letter above every thumbnail should match the ink underneath it. If a row is off,
              fix its text above (add a{' '}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-xs font-bold text-brand">~</code>{' '}
              for anything crossed out) and re-read.
            </p>
          </div>

          {/* 每行缩略图都是用户笔迹的直接呈现 */}
          <div data-clarity-mask="true">
          {result.map((row) => (
            <div key={row.index} className="mt-5">
              <p className="text-xs font-semibold text-gray-400">
                Line {row.index + 1} ·{' '}
                <span className={row.found === row.expected ? 'text-green-600' : 'text-amber-600'}>
                  {row.found} found / {row.expected} expected
                </span>
                {' '}· baseline y≈{Math.round(row.baseline)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {row.chars.map((ch, i) => (
                  <div key={`${ch}-${i}`} className="relative h-16 w-16 rounded-xl border-2 border-gray-200 bg-white p-1">
                    <span className="absolute left-1 top-0.5 z-10 text-[10px] font-bold text-gray-400">{ch}</span>
                    <Thumb m={masks[ch]} scaleBasis={scaleBasis} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          </div>
        </section>
      )}

      {ttf && !busy && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight">4 · Your font</h2>
          <p className="mt-1 text-gray-600">{included.length} characters · {(ttf.byteLength / 1024).toFixed(1)} KB</p>
          <div data-clarity-mask="true" className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
            <div className="bg-brand-light px-5 py-3 text-sm font-semibold text-brand">Live preview</div>
            <div className="p-6">
              <textarea
                value={sample} onChange={(e) => setSample(e.target.value)} rows={2}
                className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm outline-none focus:border-brand"
              />
              <div className="mt-4 min-h-28 rounded-xl bg-brand-light p-6 text-4xl leading-relaxed text-brand-ink"
                style={{ fontFamily: 'InkPreviewFF, serif' }}>
                {sample}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <input
              value={fontName} onChange={(e) => setFontName(e.target.value)}
              className="rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <button onClick={build} disabled={!!busy} className="rounded-xl bg-brand-light px-5 py-3 font-semibold text-brand disabled:opacity-50">{busy ? 'Working…' : 'Rebuild'}</button>
            <button onClick={download} className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
              Download TTF — free
            </button>
          </div>
          <p className="mt-4 max-w-2xl text-xs text-gray-500">
            Glyphs from a blank sheet are positioned by fitting a baseline through your own letters, so they
            are slightly less exact than the printed-template route. If you have a printer,{' '}
            <a href="/font-template/" className="font-semibold text-brand">the 76-box template</a> gives cleaner results.
          </p>
        </section>
      )}
    </div>
  );
}

/**
 * 缩略图：**全行统一比例 + 基线对齐**，不是各自缩放填满方框。
 *
 * 原来用的是 `s = min(56/w, 56/h)` 再居中 —— 每个字符按自己的尺寸放大到填满。
 * 后果是句号被放大近 3 倍摆在正中，看起来就是一坨黑块；而这一屏的全部意义
 * 就是让用户肉眼核对每个字形对不对。用户分不清「正确的句号」和「坏掉的字符」，
 * 这一屏就白做了 —— 实测就是这样被误判成识别错误的。
 *
 * 现在所有缩略图共用一个比例（由该套笔迹的基线-x高距离推出），并把基线压在
 * 方框固定高度上。于是句号是个小点、H 是个大字母、g 的尾巴垂到基线以下 ——
 * 跟它们在真实文本里的样子一致，一眼就能看出哪个不对。
 */
const TH = 56;                 // 缩略图边长
const TH_BASELINE = 0.72;      // 基线在缩略图里的高度比例
const TH_SPAN = 2.15;          // 显示范围 = 2.15 × x-height（够放下上升部与下伸部）

function Thumb({
  m, scaleBasis,
}: {
  m?: { mask: Uint8ClampedArray; w: number; h: number; baseTop: number };
  scaleBasis: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host || !m || !scaleBasis) return;
    host.width = TH; host.height = TH;
    const ctx = host.getContext('2d')!;
    ctx.clearRect(0, 0, TH, TH);

    const s = TH / (TH_SPAN * scaleBasis);      // 全行统一
    const baseY = TH * TH_BASELINE;
    const src = maskToCanvas(m.mask, m.w, m.h);
    ctx.drawImage(
      src,
      (TH - m.w * s) / 2,                        // 水平居中
      baseY - m.baseTop * s,                     // 竖直按基线对齐
      m.w * s, m.h * s,
    );

    // 基线参考线，让"坐没坐在线上"变成可见的事
    ctx.strokeStyle = 'rgba(103,58,184,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(3, baseY + .5); ctx.lineTo(TH - 3, baseY + .5); ctx.stroke();
  }, [m, scaleBasis]);
  return <canvas ref={ref} className="h-full w-full" />;
}
