import Link from 'next/link';

/**
 * 站内主题簇的连接件 —— 内链结构在这里集中定义，而不是散在各页正文里。
 *
 * 为什么要有这个文件：Google 判断"哪个页面重要"靠的是内链的**数量与锚文本**，
 * 而 nav/footer 的模板链接每页都一样，等于没有区分度 —— 全站权重被摊平。
 * 正文里的上下文链接才带信号，但散在各页写就没人能回答"哪个页面入链最多"。
 * 集中在一张表里，这个问题随时可查、可调。
 *
 * 两个簇，两个枢纽：
 *   模板簇  hub = /font-template/       （全站唯一排进前 10 的页面）
 *   概念簇  hub = /handwriting-to-font/ （KD 19–31 的主词族落地页）
 * 两个枢纽在下表里出现次数最多，这是刻意的 —— 权重要往能赢的页面流。
 *
 * 锚文本一律用目标页的目标关键词，不要写 "learn more" / "click here"：
 * 锚文本是这条链接携带的唯一语义，浪费掉就只剩一个投票。
 */

type Item = { href: string; anchor: string; blurb: string };

const P: Record<string, Item> = {
  create: {
    href: '/create/',
    anchor: 'Make your own font',
    blurb: 'Upload a photo of your filled-in template and get an installable TTF.',
  },
  template: {
    href: '/font-template/',
    anchor: 'Free printable font template',
    blurb: '76 boxes with printed baselines — the most accurate route, one sheet of A4.',
  },
  templatePdf: {
    href: '/font-template-pdf/',
    anchor: 'Font template PDF',
    blurb: 'Save the sheet as a PDF to keep, email, or take to a print shop.',
  },
  fromImage: {
    href: '/font-from-image/',
    anchor: 'Handwriting to font from a photo',
    blurb: 'No printer — write on plain paper and photograph it.',
  },
  draw: {
    href: '/draw/',
    anchor: 'Draw your own font online',
    blurb: 'Write straight onto the screen with an Apple Pencil or drawing tablet.',
  },
  generator: {
    href: '/handwriting-font-generator/',
    anchor: 'Handwriting font generator',
    blurb: 'The three routes in one place — pick one and start writing.',
  },
  h2f: {
    href: '/handwriting-to-font/',
    anchor: 'How handwriting becomes a font',
    blurb: 'What the software actually does with your letters, and why the baseline decides everything.',
  },
  howTo: {
    href: '/make-your-own-font/',
    anchor: 'How to make your own font',
    blurb: 'All three routes walked through end to end.',
  },
  install: {
    href: '/how-to-install-a-font/',
    anchor: 'How to install a font',
    blurb: 'Windows, macOS, iPhone, Android, Google Docs and Canva.',
  },
  alt: {
    href: '/calligraphr-alternative/',
    anchor: 'A free Calligraphr alternative',
    blurb: 'An honest comparison — including where Calligraphr is the better tool.',
  },
};

/** 每个页面往外发的三条上下文链接。键是页面路径。 */
const CLUSTER: Record<string, (keyof typeof P)[]> = {
  '/':                          ['generator', 'h2f', 'template'],
  '/create/':                   ['template', 'h2f', 'templatePdf'],
  '/draw/':                     ['generator', 'template', 'install'],
  '/font-from-image/':          ['h2f', 'template', 'install'],
  '/font-template/':            ['templatePdf', 'generator', 'create'],
  '/font-template-pdf/':        ['template', 'create', 'h2f'],
  '/make-your-own-font/':       ['generator', 'templatePdf', 'alt'],
  '/handwriting-font-generator/': ['template', 'h2f', 'install'],
  '/handwriting-to-font/':      ['generator', 'template', 'fromImage'],
  '/how-to-install-a-font/':    ['generator', 'h2f', 'alt'],
  '/calligraphr-alternative/':  ['generator', 'template', 'h2f'],
  '/about/':                    ['generator', 'h2f', 'template'],
};

export default function RelatedLinks({ page }: { page: string }) {
  const keys = CLUSTER[page];
  if (!keys) return null;
  return (
    <nav aria-label="Related pages" className="no-print mt-14 border-t border-gray-200 pt-8">
      <h2 className="text-lg font-bold">Keep reading</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {keys.map((k) => {
          const it = P[k];
          return (
            <li key={it.href} className="rounded-2xl border border-gray-200 p-4">
              <Link href={it.href} className="font-semibold text-brand hover:underline">
                {it.anchor}
              </Link>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{it.blurb}</p>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
