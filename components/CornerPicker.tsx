'use client';
/**
 * 手动点选四角兜底 —— P0，不是可选项。
 *
 * spike 里第一版代码交出过一套缺 B/Z/m/y 的字体：标记检测「成功」了，
 * 但选中的是错误的暗色块，单应轻微偏移，切格悄悄丢字，全程不报错。
 * 校正后自检会拦下这种情况并落到这里，让用户自己指出纸的四角。
 */
import { useEffect, useRef, useState } from 'react';
import type { ManualCorners } from '@/lib/pipeline/client';

const LABELS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

export default function CornerPicker({
  image, width, height, message, onConfirm, onCancel,
}: {
  image: ImageBitmap | HTMLCanvasElement;
  width: number; height: number;
  message: string;
  onConfirm: (c: ManualCorners) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pts, setPts] = useState<[number, number][]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [box, setBox] = useState({ w: 640, h: 480 });

  // 初始给一个内缩 8% 的四边形，多数情况下用户只需微调而不是从零点四下
  useEffect(() => {
    const m = 0.08;
    setPts([
      [width * m, height * m], [width * (1 - m), height * m],
      [width * (1 - m), height * (1 - m)], [width * m, height * (1 - m)],
    ]);
  }, [width, height]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || pts.length !== 4) return;
    const scale = Math.min(640 / width, 520 / height);
    const w = Math.round(width * scale), h = Math.round(height * scale);
    if (box.w !== w || box.h !== h) setBox({ w, h });
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image as CanvasImageSource, 0, 0, w, h);

    ctx.strokeStyle = '#673AB8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * scale, y * scale) : ctx.moveTo(x * scale, y * scale)));
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(103,58,184,.12)';
    ctx.fill();

    pts.forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.arc(x * scale, y * scale, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#673AB8'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#673AB8';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x * scale, y * scale);
    });
  }, [pts, image, width, height, box.w, box.h]);

  const toImage = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const scale = width / r.width;
    return [(e.clientX - r.left) * scale, (e.clientY - r.top) * scale] as [number, number];
  };

  const down = (e: React.PointerEvent) => {
    const [x, y] = toImage(e);
    let best = 0, bd = Infinity;
    pts.forEach(([px, py], i) => {
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    setDragging(best);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (dragging === null) return;
    const [x, y] = toImage(e);
    setPts((p) => p.map((q, i) => (i === dragging ? [Math.max(0, Math.min(width, x)), Math.max(0, Math.min(height, y))] : q)));
  };

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
      <h3 className="text-lg font-bold text-ink">We couldn&apos;t find the corner squares</h3>
      <p className="mt-2 text-sm text-amber-900">{message}</p>
      <p className="mt-3 text-sm text-gray-600">
        Drag the four handles onto the <b>corners of the sheet of paper</b> — 1 top-left, then clockwise.
      </p>
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => setDragging(null)}
        className="mt-4 max-w-full cursor-crosshair touch-none rounded-xl border border-gray-300 bg-white"
        style={{ width: box.w, height: box.h }}
      />
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
        {LABELS.map((l, i) => <span key={l}>{i + 1} = {l}</span>)}
      </div>
      <div className="mt-5 flex gap-3">
        <button
          onClick={() => onConfirm(pts as ManualCorners)}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Use these corners
        </button>
        <button onClick={onCancel} className="rounded-xl bg-white px-6 py-3 font-semibold text-gray-600 ring-1 ring-gray-300">
          Try another photo
        </button>
      </div>
    </div>
  );
}
