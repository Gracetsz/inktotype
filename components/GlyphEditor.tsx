'use client';
/**
 * 单格重写 —— 质检失败后的恢复阀门。
 * 没有它，76 格里失败 5 格用户就走进死路（重写整张纸重拍）。
 * 画布尺寸与切割结果一致，保存后直接回灌管线，度量对齐照旧用模板基线。
 */
import { useEffect, useRef, useState } from 'react';
import { maskToCanvas, canvasToMask } from '@/lib/pipeline/client';
import type { CellSummary } from '@/lib/pipeline/client';

type Tool = 'pen' | 'eraser';

export default function GlyphEditor({
  char, mask, cell, onSave, onClose,
}: {
  char: string;
  mask: Uint8ClampedArray;
  cell: CellSummary;
  onSave: (mask: Uint8ClampedArray) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [size, setSize] = useState(14);
  const drawing = useRef(false);
  const last = useRef<[number, number] | null>(null);

  // 画布用切割结果的真实像素尺寸，保证保存回去时坐标系完全一致
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = cell.w; c.height = cell.h;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cell.w, cell.h);
    ctx.drawImage(maskToCanvas(mask, cell.w, cell.h), 0, 0);
  }, [mask, cell.w, cell.h]);

  const at = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * cell.w, ((e.clientY - r.top) / r.height) * cell.h];
  };

  const stroke = (from: [number, number], to: [number, number]) => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'pen' ? size : size * 2.4;
    ctx.strokeStyle = tool === 'pen' ? '#43267a' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
  };

  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = at(e);
    stroke(last.current, last.current);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const p = at(e);
    stroke(last.current, p);
    last.current = p;
  };
  const up = () => { drawing.current = false; last.current = null; };

  const clear = () => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cell.w, cell.h);
  };

  // 基线与 x-height 在裁切坐标里的位置：切割时上扩了 30px，基线固定在其下方
  const baselinePct = ((cell.h - 40 - (cell.h - 70) * 0.28) / cell.h) * 100;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-bold text-ink">
            Redraw <span className="text-brand">{char}</span>
          </h3>
          <span className="text-xs text-gray-400">{cell.status} · ink {(cell.coverage * 100).toFixed(1)}%</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Sit the letter on the purple line. Descenders should hang below it.</p>

        {/* 重绘画布上就是用户的笔迹本身 */}
        <div className="relative mt-4" data-clarity-mask="true">
          <canvas
            ref={ref}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
            className="w-full touch-none rounded-xl border-2 border-gray-200 bg-white"
            style={{ aspectRatio: `${cell.w} / ${cell.h}`, cursor: 'crosshair' }}
          />
          <div
            className="pointer-events-none absolute inset-x-3 border-t-2 border-dashed border-brand-mid"
            style={{ top: `${baselinePct}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(['pen', 'eraser'] as Tool[]).map((t) => (
            <button
              key={t} onClick={() => setTool(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tool === t ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t === 'pen' ? 'Pen' : 'Eraser'}
            </button>
          ))}
          <input
            type="range" min={4} max={40} value={size}
            onChange={(e) => setSize(+e.target.value)}
            className="ml-1 w-28 accent-brand"
          />
          <button onClick={clear} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">Clear</button>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-500">Cancel</button>
          <button
            onClick={() => onSave(canvasToMask(ref.current!))}
            className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Use this drawing
          </button>
        </div>
      </div>
    </div>
  );
}
