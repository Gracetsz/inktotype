import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import RouteChooser from '@/components/RouteChooser';
import { JsonLd, Faq, faqPage, howTo, breadcrumb } from '@/components/Seo';
import { url, OG_IMAGE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'How to make your own font from your handwriting',
  description: 'Create your own font in about ten minutes: write the alphabet, photograph it, download an installable TTF. Three routes, no design software, free.',
  alternates: { canonical: url('/make-your-own-font/') },
  openGraph: {
    title: 'How to make your own font from your handwriting',
    description: 'Write the alphabet, photograph it, download a TTF. Free, no account, nothing uploaded.',
    url: url('/make-your-own-font/'),
    // 自定义 openGraph 会整个替换掉文件约定生成的那份，images 必须手动带上
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'How do I make my own font?',
    a: 'Write every character once, capture it as an image, and let software convert each character into a glyph with the correct position relative to the baseline. On this site that means: get a template, write in it, photograph it, and download a TTF. It takes about ten minutes and costs nothing.',
  },
  {
    q: 'How long does it actually take?',
    a: 'Writing 76 characters takes most people six to eight minutes. Photographing and converting takes under a minute — the conversion itself runs in about a second. The slow part is the writing, not the software.',
  },
  {
    q: 'Do I need any design software?',
    a: 'No. You need a pen, paper and a phone camera. Font editors like FontForge or Glyphs are for drawing letterforms from scratch; this is the opposite problem — you already have the letterforms, in your own hand, and only need them measured and packaged.',
  },
  {
    q: 'Why do my g, p and y look wrong in other font makers?',
    a: 'Almost always because each letter was aligned by its own bounding box instead of a shared baseline. That puts the tail of a g level with the bottom of an o, and the whole line looks like it is bouncing. The fix is to measure every glyph against one baseline and one scale for the entire sheet, which is why our template prints a baseline in every box.',
  },
  {
    q: 'Can I sell things made with my font?',
    a: 'The font is made from your own handwriting, so it is yours. Nothing on this site claims rights over what you create with it. Do not, however, build a font by copying someone else’s published typeface — see our terms.',
  },
  {
    q: 'Will it look like my actual handwriting?',
    a: 'It will look like your printing, one character at a time. It cannot reproduce joined-up cursive, because a font stores each character separately and has no way to know what the previous letter was. Write the way you would write on a form, not the way you would sign your name.',
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd
        data={[
          breadcrumb([{ name: 'Home', path: '/' }, { name: 'Make your own font', path: '/make-your-own-font/' }]),
          faqPage(FAQ),
          howTo('Make your own font from your handwriting', [
            { name: 'Choose a route', text: 'Printed template for the best result, plain paper if you have no printer, or write straight in the browser with a stylus.' },
            { name: 'Write every character once', text: 'A–Z, a–z, 0–9 and punctuation, with a dark pen, sitting each letter on the baseline.' },
            { name: 'Capture it', text: 'Photograph the sheet with your phone, or skip this step entirely on the browser route.' },
            { name: 'Review and download', text: 'Check each character was read correctly, redraw any that were not, and download your TTF.' },
          ]),
        ]}
      />

      <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
        How to make your own font from your handwriting
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-gray-600">
        Making a font used to mean drawing 76 letterforms in a font editor. It does not any more. If the
        letters you want already exist — in your own hand — the job is not drawing them, it is{' '}
        <b>measuring</b> them: cutting each character out, working out where it sits relative to the baseline,
        and packaging the lot into a file your operating system understands. That takes about ten minutes and
        no design software at all.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Pick how you want to write</h2>
        <p className="mt-2 text-gray-600">
          The three routes differ only in how your letters get captured. Everything after that is identical.
        </p>
        <RouteChooser compact />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">The one thing that decides whether it looks right</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          A font does not store pictures of letters. It stores outlines in a coordinate system whose origin is
          the <b>baseline</b> — the invisible line your writing sits on. An <i>o</i> rests at y = 0. The tail of a{' '}
          <i>g</i> goes to a negative y. The stem of an <i>h</i> reaches well above the x-height. Those numbers,
          not the shapes, are what make a line of text look settled instead of bouncing.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          This is where most do-it-yourself fonts fall apart. If each letter is normalised by its own bounding
          box — scaled and positioned to fill its own little square — then every character ends up the same
          height and sitting on the same line. Your <i>g</i> loses its tail, your <i>h</i> loses its stem, and
          the result reads like a ransom note.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          The fix is unglamorous: measure every glyph against <b>one baseline and one scale for the whole
          sheet</b>. That is the entire reason our printed template has a solid line and a fainter x-height
          line in every box, and the reason the plain-paper route works out a baseline by fitting a line
          through the letters you actually wrote rather than guessing per letter.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">What a font file actually contains</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          A TrueType file is a set of tables. The{' '}
          <a className="font-semibold text-brand hover:underline" href="https://learn.microsoft.com/en-us/typography/opentype/spec/otff" target="_blank" rel="noopener noreferrer">OpenType specification</a>{' '}
          lists eight tables that every font must have —{' '}
          <span className="font-mono text-sm">cmap</span> (which character maps to which glyph),{' '}
          <span className="font-mono text-sm">hmtx</span> and <span className="font-mono text-sm">hhea</span>{' '}
          (widths and line spacing), <span className="font-mono text-sm">name</span> (what it is called),
          plus <span className="font-mono text-sm">head</span>,{' '}
          <span className="font-mono text-sm">maxp</span>, <span className="font-mono text-sm">OS/2</span>{' '}
          and <span className="font-mono text-sm">post</span>. The outlines themselves live in two more,{' '}
          <span className="font-mono text-sm">glyf</span> and <span className="font-mono text-sm">loca</span>,
          which the spec lists separately as the tables used for TrueType outlines.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          One detail in there causes more complaints than the rest combined: vertical metrics are stored in{' '}
          <i>three</i> places — <span className="font-mono text-sm">hhea</span>, the OS/2 typo fields, and the
          OS/2 win fields — and different applications read different ones. Set them inconsistently and your
          font has one line height in Word and another in Photoshop. We write all three identically, and size
          them from your actual tallest and lowest glyph so nothing gets clipped.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">Writing tips that actually change the result</h2>
        <ul className="mt-4 space-y-3 text-gray-600">
          <li><b className="text-ink">Print, don&apos;t join.</b> A font sets each character independently and cannot know what came before it. Joined-up cursive will not connect. Write the way you fill in a form.</li>
          <li><b className="text-ink">Use a medium-tip dark pen.</b> Ballpoint, gel or fineliner. Pencil is too grey and smudges; a 0.2 mm pen can disappear at photo resolution.</li>
          <li><b className="text-ink">Let the descenders drop.</b> If <i>g p q y j</i> do not go below the line on paper, they cannot go below it in the font.</li>
          <li><b className="text-ink">Leave air between characters.</b> Two letters that touch get read as one glyph.</li>
          <li><b className="text-ink">Write at a natural speed.</b> Slow, careful lettering does not look like you. The point of the exercise is that it does.</li>
        </ul>
      </section>

      <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />

      <section className="mt-14 rounded-2xl bg-brand-light p-8 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight">Ten minutes from now you could be typing in your own hand</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/create/" className="rounded-xl bg-brand px-7 py-3.5 font-semibold text-white hover:bg-brand-dark">
            Start with the template →
          </Link>
          <Link href="/font-from-image/" className="rounded-xl bg-white px-7 py-3.5 font-semibold text-brand">
            No printer? Start here
          </Link>
        </div>
      </section>
      <RelatedLinks page="/make-your-own-font/" />
    </main>
  );
}
