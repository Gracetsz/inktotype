'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  decodeImage, processPhoto, buildFontFile, maskToCanvas, canvasToMask, resetWorker,
  type CellSummary, type ManualCorners, type Progress,
} from '@/lib/pipeline/client';
import { CHARS, buildLayout } from '@/lib/template';
import { track, EV } from '@/lib/analytics';
import CornerPicker from './CornerPicker';
import GlyphEditor from './GlyphEditor';
import RouteChooser from './RouteChooser';

/** 模板几何：缩略图要按它算统一比例与基线位置 */
const LAYOUT = buildLayout();
const BAND = LAYOUT.cells.A.baseline - LAYOUT.cells.A.xheight;

type Step = 1 | 2 | 3 | 4;
type Masks = Record<string, Uint8ClampedArray>;
type Override = { mask: Uint8ClampedArray; w: number; h: number; y0c: number };

const STEPS = ['Get template', 'Upload photo', 'Review & fix', 'Preview & download'];

export default function CreateWizard() {
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [img, setImg] = useState<{ rgba: Uint8ClampedArray; width: number; height: number } | null>(null);
  const [preview, setPreview] = useState<HTMLCanvasElement | null>(null);
  const [manualPrompt, setManualPrompt] = useState<string | null>(null);

  const [cells, setCells] = useState<CellSummary[]>([]);
  const [masks, setMasks] = useState<Masks>({});
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [editing, setEditing] = useState<string | null>(null);

  const [fontName, setFontName] = useState('My Handwriting');
  const [ttf, setTtf] = useState<ArrayBuffer | null>(null);
  const [included, setIncluded] = useState<string[]>([]);
  const [sample, setSample] = useState('The quick brown fox jumps over 12 lazy dogs!');
  const [stats, setStats] = useState<{ processMs: number; buildMs: number } | null>(null);

  useEffect(() => {
    track(EV.createStarted, { route: 'template' });
    return () => resetWorker();
  }, []);

  /* ---------- 步骤 2：上传并处理 ---------- */
  const runProcess = useCallback(async (
    image: { rgba: Uint8ClampedArray; width: number; height: number },
    manual?: ManualCorners,
  ) => {
    setError(null); setManualPrompt(null); setBusy({ phase: 'Starting', done: 0, total: 1 });
    try {
      const r = await processPhoto(image, { manual, onProgress: setBusy });
      setCells(r.cells); setMasks(r.masks); setOverrides({});
      setStats((s) => ({ processMs: r.ms, buildMs: s?.buildMs ?? 0 }));
      // 切格成功率是 L0 那个存亡指标的线上版本：合成图上是 76/76，
      // 真实用户的照片上是多少，只有这里报得出来。
      track(EV.photoProcessed, {
        route: 'template',
        ok: r.cells.filter((c) => c.status === 'ok').length,
        total: r.cells.length,
        manual: manual ? 1 : 0,
        ms: r.ms,
      });
      setStep(3);
    } catch (e: any) {
      if (e?.needsManualCorners) { setManualPrompt(e.message); track(EV.cornersManual, { route: 'template' }); }
      else setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }, []);

  const onFile = useCallback(async (file: File) => {
    setError(null); setTtf(null);
    // 只报文件类型和大小量级，不报文件名 —— 文件名常常带真名（"张三的字.jpg"）。
    track(EV.photoUploaded, { route: 'template', type: file.type, kb: Math.round(file.size / 1024) });
    try {
      setBusy({ phase: 'Decoding photo', done: 0, total: 1 });
      const image = await decodeImage(file);
      setImg(image);
      const c = document.createElement('canvas');
      c.width = image.width; c.height = image.height;
      c.getContext('2d')!.putImageData(new ImageData(image.rgba, image.width, image.height), 0, 0);
      setPreview(c);
      await runProcess(image);
    } catch (e: any) {
      setBusy(null);
      setError(e?.message ?? String(e));
    }
  }, [runProcess]);

  /* ---------- 步骤 4：装配与预览 ---------- */
  const build = useCallback(async () => {
    setError(null); setBusy({ phase: 'Building', done: 0, total: 1 });
    try {
      const r = await buildFontFile(fontName, overrides, setBusy);
      setTtf(r.ttf); setIncluded(r.included);
      setStats((s) => ({ processMs: s?.processMs ?? 0, buildMs: r.ms }));
      track(EV.fontBuilt, {
        route: 'template',
        chars: r.included.length,
        edits: Object.keys(overrides).length,
        ms: r.ms,
      });
      const face = new FontFace('InkPreview', r.ttf);
      await face.load();
      (document.fonts as any).add(face);
      setStep(4);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }, [fontName, overrides]);

  const download = () => {
    if (!ttf) return;
    // 不上报字体名 —— 用户几乎总是填自己的名字。
    track(EV.fontDownloaded, { route: 'template', chars: included.length, kb: Math.round(ttf.byteLength / 1024) });
    const blob = new Blob([ttf], { type: 'font/ttf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fontName.replace(/[^\w\-]+/g, '') || 'MyHandwriting'}.ttf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const bad = cells.filter((c) => c.status !== 'ok');
  const weak = cells.filter((c) => c.status === 'ok' && c.confidence < 0.45);
  const ready = cells.length - bad.length + Object.keys(overrides).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Stepper step={step} />

      {busy && (
        <div className="mt-6 rounded-2xl border border-brand-mid bg-brand-light p-5">
          <p className="text-sm font-semibold text-brand">{busy.phase}…</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full bg-brand transition-all" style={{ width: `${Math.round((busy.done / Math.max(1, busy.total)) * 100)}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-800">
          {error}
        </div>
      )}

      {manualPrompt && preview && img && (
        <div className="mt-6" data-clarity-mask="true">
          <CornerPicker
            image={preview} width={img.width} height={img.height} message={manualPrompt}
            onConfirm={(c) => runProcess(img, c)}
            onCancel={() => { setManualPrompt(null); setStep(2); }}
          />
        </div>
      )}

      {/* ---------- 步骤 1 ---------- */}
      {step === 1 && !busy && (
        <section className="mt-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Print your template</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            76 boxes — A–Z, a–z, 0–9 and 14 punctuation marks. Write one character per box with a dark pen,
            sitting each letter on the solid line.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/font-template/"
              onClick={() => track(EV.templateOpened, { route: 'template' })}
              className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
            >
              Open the template →
            </Link>
            <button onClick={() => setStep(2)} className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
              I already have a filled sheet
            </button>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-sm font-semibold text-gray-500">No printer? There are two other ways.</p>
            <RouteChooser compact exclude="/create/" />
          </div>
        </section>
      )}

      {/* ---------- 步骤 2 ---------- */}
      {step === 2 && !busy && !manualPrompt && (
        <section className="mt-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Upload your photo</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            A phone photo is fine — angle, shadows and a bit of blur are all handled. Just make sure the
            <b> whole sheet including the four black squares</b> is in frame.
          </p>
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-mid bg-brand-light py-16 text-center hover:border-brand">
            <span className="text-lg font-semibold text-brand">Choose photo or drop it here</span>
            <span className="mt-1 text-sm text-gray-500">JPG or PNG · processed entirely in your browser</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
        </section>
      )}

      {/* ---------- 步骤 3 ---------- */}
      {step === 3 && !busy && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Review your letters</h1>
              <p className="mt-2 text-gray-600">
                <b className="text-brand">{ready}</b> of {CHARS.length} ready
                {bad.length > 0 && <> · <b className="text-red-600">{bad.length}</b> need attention</>}
                {weak.length > 0 && <> · {weak.length} look faint</>}
                {stats && <> · cut in {stats.processMs} ms</>}
              </p>
            </div>
            <button onClick={build} disabled={!!busy} className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
              Build my font →
            </button>
          </div>
          {/*
            写错格是唯一的静默错误：那格有墨迹、质检通过、位置正确，管线完全看不出
            `b` 的格子里画的是 `d`。它不会标红，只会在最后打字预览时才可能被察觉。
            这一屏是全流程里唯一能抓住它的地方，所以必须把话说出来，而不是指望用户自己想到。
          */}
          <div className="mt-4 rounded-2xl border-2 border-brand bg-brand-light p-4">
            <p className="text-sm font-bold text-ink">Check the letter, not just the colour.</p>
            <p className="mt-1 text-sm text-gray-700">
              Red and amber boxes are ones we&apos;re unsure about — but there is one mistake we can&apos;t
              detect at all: <b>writing the wrong letter in a box</b>. If a <b>d</b> ended up in the{' '}
              <b>b</b> box, everything looks perfectly fine here and your font quietly ships with a wrong
              letter. Each box is labelled in its top-left corner. Skim the grid once and make sure every
              box holds the character it is labelled with — then click any box to redraw it.
            </p>
          </div>
          {/*
            data-clarity-mask 的作用域是这个节点及其全部子节点，且被遮罩的内容
            "never captures anything that is masked or sent over the wire" ——
            是发送前就在客户端抹掉，不是上传后在回放里隐藏。

            严格说这一层是冗余的：缩略图全部画在 <canvas> 上，而 Clarity 在
            平台层面就抓不了 canvas。但"你的笔迹从不离开设备"是这个产品的
            全部价值，不该押在某个第三方工具当前的能力边界上——那个边界会变。
          */}
          <div data-clarity-mask="true">
            <GlyphGrid cells={cells} masks={masks} overrides={overrides} onPick={setEditing} />
          </div>
        </section>
      )}

      {/* ---------- 步骤 4 ---------- */}
      {step === 4 && ttf && !busy && (
        <section className="mt-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Your font is ready</h1>
          <p className="mt-2 text-gray-600">
            {included.length} characters · {(ttf.byteLength / 1024).toFixed(1)} KB
            {stats && <> · assembled in {stats.buildMs} ms</>}
          </p>

          {/* 实时预览用的就是用户自己的字体在渲染文本 —— 那是笔迹本身，必须遮 */}
          <div data-clarity-mask="true" className="mt-6 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="bg-brand-light px-5 py-3 text-sm font-semibold text-brand">Live preview</div>
            <div className="p-6">
              <textarea
                value={sample} onChange={(e) => setSample(e.target.value)} rows={2}
                className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm outline-none focus:border-brand"
              />
              <div
                className="mt-4 min-h-32 rounded-xl bg-brand-light p-6 text-4xl leading-relaxed text-brand-ink"
                style={{ fontFamily: 'InkPreview, serif' }}
              >
                {sample}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              value={fontName} onChange={(e) => setFontName(e.target.value)}
              className="rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand"
              placeholder="Font name"
            />
            <button onClick={build} disabled={!!busy} className="rounded-xl bg-brand-light px-5 py-3 font-semibold text-brand disabled:opacity-50">{busy ? 'Working…' : 'Rebuild'}</button>
            <button onClick={download} className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
              Download TTF — free
            </button>
            <button onClick={() => setStep(3)} className="rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:text-brand">
              ← Back to review
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            TTF and WOFF2 are the supported formats. OTF is not offered — a renamed TrueType file
            misbehaves in Illustrator, and a broken export is worse than no export.
          </p>
        </section>
      )}

      {editing && masks[editing] && (
        <GlyphEditor
          char={editing}
          mask={overrides[editing]?.mask ?? masks[editing]}
          cell={cells.find((c) => c.char === editing)!}
          onClose={() => setEditing(null)}
          onSave={(mask) => {
            const c = cells.find((x) => x.char === editing)!;
            setOverrides((o) => ({ ...o, [editing]: { mask, w: c.w, h: c.h, y0c: c.y0c } }));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n === step ? 'now' : n < step ? 'done' : 'todo';
        return (
          <li
            key={label}
            className={
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ' +
              (state === 'now' ? 'bg-brand text-white'
                : state === 'done' ? 'bg-brand-light text-brand'
                  : 'bg-gray-100 text-gray-400')
            }
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-xs">
              {state === 'done' ? '✓' : n}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function GlyphGrid({
  cells, masks, overrides, onPick,
}: {
  cells: CellSummary[]; masks: Masks;
  overrides: Record<string, Override>;
  onPick: (ch: string) => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
      {cells.map((c) => {
        const edited = !!overrides[c.char];
        const tone = edited ? 'border-brand bg-brand-light'
          : c.status !== 'ok' ? 'border-red-400 bg-red-50'
            : c.confidence < 0.45 ? 'border-amber-400 bg-amber-50'
              : 'border-gray-200 bg-white hover:border-brand';
        return (
          <button
            key={c.char}
            onClick={() => onPick(c.char)}
            title={`${c.char} · ${c.status} · ink ${(c.coverage * 100).toFixed(1)}%`}
            className={`relative aspect-square rounded-xl border-2 p-1 transition ${tone}`}
          >
            <span className="absolute left-1 top-0.5 text-[10px] font-bold text-gray-400">{c.char}</span>
            <GlyphThumb
              mask={overrides[c.char]?.mask ?? masks[c.char]}
              w={c.w} h={c.h}
              baseTop={LAYOUT.cells[c.char].baseline - (overrides[c.char]?.y0c ?? c.y0c)}
            />
            {c.status !== 'ok' && (
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold uppercase text-red-500">{c.status}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 缩略图：**全格统一比例 + 基线对齐**，不是各自缩放填满方框。
 *
 * 原来是 `s = min(64/w, 64/h)` 再居中，每个字符按自己的尺寸放大到填满 ——
 * 句号会被放大近 3 倍摆在正中，看起来就是一坨黑块。而这一屏存在的唯一理由
 * 就是让用户肉眼核对每个格子里的字对不对（写错格是管线唯一抓不到的错误）。
 * 缩略图自己把小字符画成黑块，这一屏就白做了。
 *
 * 统一比例由模板几何给出（基线到 x-height 是固定的 110px），所以句号是小点、
 * H 是大字母、g 的尾巴垂到基线以下 —— 跟真实文本里一致。
 */
const TH = 64;
const TH_BASELINE = 0.72;
const TH_SPAN = 2.15;

function GlyphThumb({
  mask, w, h, baseTop,
}: { mask?: Uint8ClampedArray; w: number; h: number; baseTop: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host || !mask) return;
    host.width = TH; host.height = TH;
    const ctx = host.getContext('2d')!;
    ctx.clearRect(0, 0, TH, TH);

    const s = TH / (TH_SPAN * BAND);
    const baseY = TH * TH_BASELINE;
    const src = maskToCanvas(mask, w, h);
    ctx.drawImage(src, (TH - w * s) / 2, baseY - baseTop * s, w * s, h * s);

    ctx.strokeStyle = 'rgba(103,58,184,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(3, baseY + .5); ctx.lineTo(TH - 3, baseY + .5); ctx.stroke();
  }, [mask, w, h, baseTop]);
  return <canvas ref={ref} className="h-full w-full" />;
}
