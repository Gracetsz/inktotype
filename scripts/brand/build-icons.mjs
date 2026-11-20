/**
 * 由 SVG 生成两张位图资产：
 *   app/apple-icon.png      180×180   iPhone 主屏图标
 *   app/opengraph-image.png 1200×630  分享卡片
 *
 * 跑法（需要 sharp）：
 *   npm i -D sharp
 *   node scripts/brand/build-icons.mjs
 *
 * 图形与 components/Logo.tsx、app/icon.svg 里的是同一份路径 —— 改动要三处同步。
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PURPLE = '#673AB8';
const INK = '#1e1b2e';

/** 鹅毛笔图案本体，画在 0 0 64 64 里，不含圆角底板。 */
const quill = (scale = 1, ox = 0, oy = 0) => `
  <g transform="translate(${ox} ${oy}) scale(${scale})">
    <path d="M49 10c8 12 3 25-16 31C29 28 36 15 49 10z" fill="#fff"/>
    <path d="M30 37l6 4-16 13z" fill="#fff"/>
    <path d="M46 14L31 38" stroke="${PURPLE}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M13 56h38" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".62"/>
  </g>`;

/**
 * Apple 触控图标：满幅、**不做圆角**。
 * iOS 会自己套圆角遮罩，自带圆角会被裁两次，边缘出现一圈紫色毛边。
 * 同理不能有透明背景 —— iOS 会把透明区填成黑色。
 */
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${PURPLE}"/>
  ${quill()}
</svg>`;

/** 分享卡片 1200×630。 */
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="0" width="1200" height="10" fill="${PURPLE}"/>

  <!-- 标志 -->
  <g transform="translate(96 92)">
    <rect width="104" height="104" rx="23" fill="${PURPLE}"/>
    ${quill(1.625)}
  </g>

  <text x="228" y="168" font-family="Inter, Helvetica, Arial, sans-serif" font-size="54" font-weight="800" letter-spacing="-1">
    <tspan fill="${PURPLE}">Ink</tspan><tspan fill="${INK}">ToType</tspan>
  </text>

  <text x="96" y="300" font-family="Inter, Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="${INK}" letter-spacing="-2">Turn your handwriting</text>
  <text x="96" y="386" font-family="Inter, Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="${PURPLE}" letter-spacing="-2">into a real font</text>

  <text x="96" y="452" font-family="Inter, Helvetica, Arial, sans-serif" font-size="30" fill="#6b6b7b">
    Print a template, write your letters, snap a photo. Free.
  </text>

  <!-- 模板格：产品的签名视觉，也顺带说明"一格一个字" -->
  <g transform="translate(96 500)">
    ${['A', 'B', 'C', 'a', 'b', 'c'].map((ch, i) => `
      <g transform="translate(${i * 78} 0)">
        <rect width="66" height="66" rx="10" fill="none" stroke="#d7c9ef" stroke-width="3"/>
        <line x1="9" y1="48" x2="57" y2="48" stroke="#d7c9ef" stroke-width="2.5"/>
        <text x="33" y="46" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="38" font-weight="600" fill="${PURPLE}">${ch}</text>
      </g>`).join('')}
  </g>

  <text x="1104" y="560" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#9a95a8">inktotype.com</text>
</svg>`;

const out = join(ROOT, 'app');
await mkdir(out, { recursive: true });

// flatten 去掉 alpha 通道：iOS 会把触控图标里的透明像素填成黑色，
// 即便图上看不出透明区，留着 alpha 通道也是自找麻烦。OG 卡片同理，
// 有些抓取器不处理 alpha，透明会变黑底。
await sharp(Buffer.from(appleSvg)).flatten({ background: PURPLE }).png().toFile(join(out, 'apple-icon.png'));
await sharp(Buffer.from(ogSvg)).flatten({ background: '#ffffff' }).png().toFile(join(out, 'opengraph-image.png'));

// 同时留一份 SVG 源，方便以后改
await mkdir(join(ROOT, 'scripts', 'brand'), { recursive: true });
await writeFile(join(ROOT, 'scripts', 'brand', 'apple-icon.svg'), appleSvg);
await writeFile(join(ROOT, 'scripts', 'brand', 'opengraph-image.svg'), ogSvg);

console.log('已生成 app/apple-icon.png (180×180) 与 app/opengraph-image.png (1200×630)');
