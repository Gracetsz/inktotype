'use client';
/**
 * 浏览器直写（路线 C）—— iPad + Apple Pencil / 手绘板 / 触屏。
 *
 * 度量上这条路其实最准：画布几何由我们定义，基线与 x-height 是精确常数，
 * 不经过透视校正、不经过二值化、不需要拟合。照片路径的所有误差在这里都不存在。
 *
 * 两个真实设备问题必须处理：
 *   · 手掌误触 —— 一旦检测到 pointerType==='pen'，之后忽略所有 touch
 *   · 笔压 —— PointerEvent.pressure 直接调笔宽，写出来才有手写的粗细变化
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHARS, anchorOf, GUIDE } from '@/lib/template';
import { buildFromMasks, canvasToMask, maskToCanvas, resetWorker, type Progress } from '@/lib/pipeline/client';
import { track, EV } from '@/lib/analytics';

/**
 * 书写画布几何。比例必须与模板格子一致，所以直接引用同一份 GUIDE 常量 ——
 * 之前这里写死 0.72 / 0.44，模板那边一改就会悄悄漂移，
 * 结果是三条路线产出的字体度量不一样，而且不会有任何报错。
 */
const PAD_W = 460, PAD_H = 480;
const BASELINE_Y = Math.round(PAD_H * GUIDE.baseline);
const XHEIGHT_Y = Math.round(PAD_H * GUIDE.xheight);

type Strokes = Record<string, Uint8ClampedArray>;

export default function DrawPad() {
  const [idx, setIdx] = useState(0);
  const [strokes, setStrokes] = useState<Strokes>({});
  const [penOnly, setPenOnly] = useState(false);
  const [width, setWidth] = useState(9);
  const [erasing, setErasing] = useState(false);
  const [busy, setBusy] = useState<Progress | null>(null);
  const [ttf, setTtf] = useState<ArrayBuffer | null>(null);
  const [included, setIncluded] = useState<string[]>([]);
  const [fontName, setFontName] = useState('My Handwriting');
  const [sample, setSample] = useState('The quick brown fox jumps over 12 lazy dogs');
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number; p: number } | null>(null);
  const char = CHARS[idx];

  useEffect(() => {
    track(EV.createStarted, { route: 'draw' });
    return () => resetWorker();
  }, []);

  /** 切换字符时把画布内容换成该字符已存的笔迹 */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = PAD_W; c.height = PAD_H;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PAD_W, PAD_H);
    const m = strokes[char];
    if (m) ctx.drawImage(maskToCanvas(m, PAD_W, PAD_H), 0, 0);
  }, [char, strokes]);

  const at = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * PAD_W,
      y: ((e.clientY - r.top) / r.height) * PAD_H,
      p: e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const line = (a: { x: number; y: number; p: number }, b: { x: number; y: number; p: number }) => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 笔压映射到线宽：0.5 压力 = 设定宽度，用力则更粗
    ctx.lineWidth = erasing ? width * 3 : width * (0.55 + b.p);
    ctx.strokeStyle = erasing ? '#ffffff' : '#43267a';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen' && !penOnly) setPenOnly(true);
    if (penOnly && e.pointerType !== 'pen') return; // 手掌误触
    drawing.current = true;
    last.current = at(e);
    line(last.current, last.current);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    if (penOnly && e.pointerType !== 'pen') return;
    const p = at(e);
    line(last.current, p);
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false; last.current = null;
    commit();
  };

  const commit = useCallback(() => {
    const c = canvasRef.current!;
    const mask = canvasToMask(c);
    let ink = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i]) ink++;
    setStrokes((s) => {
      const n = { ...s };
      if (ink < 40) delete n[char]; else n[char] = mask;
      return n;
    });
  }, [char]);

  const clear = () => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PAD_W, PAD_H);
    setStrokes((s) => { const n = { ...s }; delete n[char]; return n; });
  };

  const go = (d: number) => setIdx((i) => Math.max(0, Math.min(CHARS.length - 1, i + d)));

  const done = Object.keys(strokes).length;

  const build = useCallback(async () => {
    setError(null); setBusy({ phase: 'Assembling the font', done: 0, total: 1 });
    try {
      const items = CHARS.filter((c) => strokes[c]).map((c) => ({ char: c, mask: strokes[c], w: PAD_W, h: PAD_H }));
      const r = await buildFromMasks(fontName, items, BASELINE_Y, XHEIGHT_Y, setBusy);
      setTtf(r.ttf); setIncluded(r.included);
      track(EV.fontBuilt, { route: 'draw', chars: r.included.length, pen: penOnly ? 1 : 0 });
      const face = new FontFace('InkPreviewDraw', r.ttf);
      await face.load();
      (document.fonts as any).add(face);
    } catch (e: any) { setError(e?.message ?? String(e)); } finally { setBusy(null); }
  }, [fontName, strokes]);

  const download = () => {
    if (!ttf) return;
    track(EV.fontDownloaded, { route: 'draw', chars: included.length, kb: Math.round(ttf.byteLength / 1024) });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ttf], { type: 'font/ttf' }));
    a.download = `${fontName.replace(/[^\w\-]+/g, '') || 'MyHandwriting'}.ttf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const hint = useMemo(() => {
    const a = anchorOf(char);
    if (!/[a-zA-Z0-9]/.test(char)) {
      return a === 'xheight-top' ? 'Hang it above the dashed line.'
        : a === 'middle' ? 'Centre it between the two lines.'
          : 'Sit it on the solid line.';
    }
    if ('gpqyj'.includes(char)) return 'Let the tail hang below the solid line.';
    if ('bdfhklt'.includes(char)) return 'Tall letter — start well above the dashed line.';
    if (/[a-z]/.test(char)) return 'Top should touch the dashed line.';
    return 'Sit it on the solid line.';
  }, [char]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight">Write it right here</h1>
      <p className="mt-3 max-w-2xl text-lg text-gray-600">
        No printer, no camera. Use an iPad with Apple Pencil, a drawing tablet, or your finger.
        Metrics are exact on this route — nothing is photographed, so nothing can be distorted.
      </p>
      {!penOnly && (
        <p className="mt-2 text-sm text-amber-700">
          A stylus gives far better results than a mouse or trackpad. Palm rejection turns on automatically
          the moment a pen touches the pad.
        </p>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr]">
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-gray-500">
              {idx + 1} / {CHARS.length} · <b className="text-2xl text-brand">{char}</b>
            </p>
            <p className="text-xs text-gray-400">{done} written</p>
          </div>

          {/* 书写板 —— 用户正在写的就是笔迹本身 */}
          <div className="relative mt-2" style={{ width: 'min(100%, 460px)' }} data-clarity-mask="true">
            <canvas
              ref={canvasRef}
              onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
              className="w-full touch-none rounded-2xl border-2 border-gray-200 bg-white"
              style={{ aspectRatio: `${PAD_W} / ${PAD_H}`, cursor: 'crosshair' }}
            />
            <div className="pointer-events-none absolute inset-x-4 border-t-2 border-dashed border-brand-mid"
              style={{ top: `${(XHEIGHT_Y / PAD_H) * 100}%` }} />
            <div className="pointer-events-none absolute inset-x-4 border-t-2 border-brand"
              style={{ top: `${(BASELINE_Y / PAD_H) * 100}%` }} />
          </div>

          <p className="mt-2 text-sm text-gray-500">{hint}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => go(-1)} disabled={idx === 0}
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 disabled:opacity-40">← Prev</button>
            <button onClick={() => go(1)} disabled={idx === CHARS.length - 1}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Next →</button>
            <button onClick={() => setErasing((v) => !v)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${erasing ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}>
              Eraser
            </button>
            <button onClick={clear} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600">Clear</button>
            <input type="range" min={3} max={26} value={width} onChange={(e) => setWidth(+e.target.value)} className="w-24 accent-brand" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-500">All {CHARS.length} characters</p>
          <div className="mt-2 grid grid-cols-8 gap-1.5 sm:grid-cols-10" data-clarity-mask="true">
            {CHARS.map((c, i) => (
              <button key={c} onClick={() => setIdx(i)}
                title={c}
                className={`relative aspect-square rounded-lg border-2 text-xs font-bold transition ${
                  i === idx ? 'border-brand bg-brand-light'
                    : strokes[c] ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white hover:border-brand-mid'
                }`}>
                <span className="absolute left-1 top-0 text-[9px] text-gray-400">{c}</span>
                {strokes[c] && <Mini m={strokes[c]} />}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={build} disabled={!done || !!busy}
              className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-40">
              Build my font ({done})
            </button>
            {busy && <span className="text-sm font-semibold text-brand">{busy.phase}…</span>}
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
      </div>

      {ttf && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Your font</h2>
          <p className="mt-1 text-gray-600">{included.length} characters · {(ttf.byteLength / 1024).toFixed(1)} KB</p>
          <div data-clarity-mask="true" className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
            <div className="bg-brand-light px-5 py-3 text-sm font-semibold text-brand">Live preview</div>
            <div className="p-6">
              <textarea value={sample} onChange={(e) => setSample(e.target.value)} rows={2}
                className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm outline-none focus:border-brand" />
              <div className="mt-4 min-h-28 rounded-xl bg-brand-light p-6 text-4xl leading-relaxed text-brand-ink"
                style={{ fontFamily: 'InkPreviewDraw, serif' }}>{sample}</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <input value={fontName} onChange={(e) => setFontName(e.target.value)}
              className="rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand" />
            <button onClick={build} disabled={!!busy} className="rounded-xl bg-brand-light px-5 py-3 font-semibold text-brand disabled:opacity-50">{busy ? 'Working…' : 'Rebuild'}</button>
            <button onClick={download} className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
              Download TTF — free
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Mini({ m }: { m: Uint8ClampedArray }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const host = ref.current; if (!host) return;
    host.width = 48; host.height = 48;
    const ctx = host.getContext('2d')!;
    ctx.clearRect(0, 0, 48, 48);
    const s = Math.min(48 / PAD_W, 48 / PAD_H);
    ctx.drawImage(maskToCanvas(m, PAD_W, PAD_H), (48 - PAD_W * s) / 2, (48 - PAD_H * s) / 2, PAD_W * s, PAD_H * s);
  }, [m]);
  return <canvas ref={ref} className="h-full w-full" />;
}
