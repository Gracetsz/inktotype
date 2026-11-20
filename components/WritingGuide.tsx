'use client';
/**
 * 白纸流程的书写范本 —— 上传之前的强制关卡。
 *
 * 为什么必须挡一道：第一次真实测试就撞上了。用户在没看过任何说明的情况下写了一张纸，
 * 标点只写了 9 个、顺序也和默认不一样，于是字符分配整行错位 —— 而这类错误
 * 在上传之后才发现，意味着纸得重写。先看范本再写，是唯一能在源头消掉它的地方。
 */
import { useState } from 'react';

export const GUIDE_ROWS = [
  { label: 'Line 1', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', note: '26 capitals' },
  { label: 'Line 2', text: 'abcdefghijklmnopqrstuvwxyz', note: '26 lowercase' },
  { label: 'Line 3', text: '0123456789', note: '10 digits' },
  { label: 'Line 4', text: '.,!?\'"-():;&@#', note: '14 punctuation marks' },
];

export default function WritingGuide({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <section className="rounded-2xl border-2 border-brand bg-brand-light p-6">
      <h2 className="text-2xl font-extrabold tracking-tight">Before you write — read this</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-700">
        On this route there are no printed guides, so we work out where the baseline is by looking at
        <b> which character is which</b>. That only works if what you wrote matches what you tell us.
        Copy these four lines exactly, in this order.
      </p>

      <div className="mt-5 space-y-3 rounded-2xl bg-white p-5">
        {GUIDE_ROWS.map((r) => (
          <div key={r.label}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{r.label} · {r.note}</p>
            <p className="mt-0.5 break-all font-mono text-lg tracking-[0.25em] text-brand-ink">{r.text}</p>
          </div>
        ))}
      </div>

      <ul className="mt-5 space-y-2 text-sm text-gray-700">
        <li>
          <b className="text-ink">·</b> <b>Run out of room? Just start a new line.</b> Writing big is better than
          cramming 26 letters across one line — split them however you like, then add a matching line on the
          next screen. Leave a clear gap between lines.
        </li>
        <li>
          <b className="text-ink">·</b> <b>Made a mistake? Cross it out and carry on</b>, then put a{' '}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-brand">~</code>{' '}
          at that position in the line text. That tells us to skip the crossed-out blob instead of counting it
          as a character — otherwise every character after it shifts by one.
        </li>
        <li><b className="text-ink">·</b> <b>Leave a gap between characters</b> so they don&apos;t touch. Touching letters get merged into one glyph.</li>
        <li><b className="text-ink">·</b> <b>Let g p q y j hang below the line</b> you are writing on — that is what makes them look right.</li>
        <li><b className="text-ink">·</b> Dark pen on white paper. Ballpoint is fine, pencil is not.</li>
        <li><b className="text-ink">·</b> Skipping characters entirely is fine — just delete them from the line text too.</li>
      </ul>

      <p className="mt-4 rounded-xl bg-white p-4 text-sm text-gray-600">
        <b className="text-ink">Example.</b> If your sheet reads{' '}
        <span className="font-mono">ABCDEFGHIJK</span> / <span className="font-mono">LMNOPQRSTUV</span> /{' '}
        <span className="font-mono">WXYZ</span>, that&apos;s three lines, not one — enter all three.
      </p>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand"
        />
        <span className="text-gray-700">
          I&apos;ve written my sheet following these four lines (or I&apos;ll edit the lines on the next screen to match what I actually wrote).
        </span>
      </label>

      <button
        onClick={onAccept}
        disabled={!checked}
        className="mt-4 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
      >
        Continue to upload →
      </button>
    </section>
  );
}
