import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import PrintTemplate from '@/components/PrintTemplate';
import { JsonLd, Faq, faqPage, howTo, breadcrumb } from '@/components/Seo';
import { url, OG_IMAGE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free printable font template (76 boxes)',
  description: 'Download a free printable font template: 76 boxes with baselines for A–Z, a–z, 0–9 and punctuation. Print it, write in it, photograph it, get a TTF. No sign-up.',
  alternates: { canonical: url('/font-template/') },
  openGraph: {
    title: 'Free printable font template — 76 boxes',
    description: 'Print, write, photograph, download a TTF. Free, no account, nothing uploaded.',
    url: url('/font-template/'),
    // 自定义 openGraph 会整个替换掉文件约定生成的那份，images 必须手动带上
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'What is a font template?',
    a: 'A font template is a printable grid where you write one character per box, so software can cut each letter out and turn it into a font. Ours has 76 boxes and, crucially, a printed baseline and x-height line in every box — those two lines are what let letters like g, p and y hang below the line by the right amount.',
  },
  {
    q: 'Do I need to print at 100% scale?',
    a: 'No. The four black squares in the corners tell us the real printed size, so any scale works as long as the whole sheet is in your photo. The sheet is already laid out with a wide safety border so default printer margins cannot clip the squares.',
  },
  {
    q: 'Which pen should I use?',
    a: 'A dark ballpoint, gel or fineliner with a medium tip. Avoid pencil — graphite is grey and low-contrast, and it smudges. Avoid very fine 0.2 mm pens, whose strokes can vanish at photo resolution.',
  },
  {
    q: 'Should I trace the grey letter printed in each box?',
    a: 'No. The grey character shows you where the letter should sit, not what it should look like. Trace it and you get a hand-drawn copy of our typeface instead of your own handwriting. You can switch the grey letters off entirely before printing.',
  },
  {
    q: 'What if I do not have a printer?',
    a: 'Two other routes need no printer. You can write the alphabet on plain paper and photograph that, or write each character directly in the browser with a stylus or drawing tablet. Both produce an installable TTF; the printed template just gives the most exact letter positions.',
  },
  {
    q: 'Is this the same as the Calligraphr template?',
    a: 'It is the same idea — a printable grid for building a handwriting font — but a different sheet and a different tool. Ours is free for all 76 characters, needs no account, and does the whole conversion inside your browser, so your photo is never uploaded anywhere.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([{ name: 'Home', path: '/' }, { name: 'Font template', path: '/font-template/' }]),
          faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
          howTo('Make a font from a printed template', [
            { name: 'Print', text: 'Print the 76-box template on A4. Scale and margins are forgiving.' },
            { name: 'Write', text: 'Write one character per box with a dark pen, sitting each letter on the solid line.' },
            { name: 'Photograph', text: 'Take a phone photo with the whole sheet and all four black squares in frame.' },
            { name: 'Download', text: 'Upload the photo, review the cut letters, and download your TTF.' },
          ]),
        ]}
      />
      <PrintTemplate />

      <div className="no-print mx-auto max-w-3xl px-6 pb-16">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight">Why the boxes have lines in them</h2>
          <p className="mt-3 leading-relaxed text-gray-600">
            Most printable alphabet sheets are just a grid. Ours prints two extra lines in every box — a solid
            baseline and a fainter x-height line — and they are the reason the resulting font looks right
            rather than merely legible.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            A font does not store letters as pictures. It stores each glyph in a coordinate system where{' '}
            <b>y = 0 is the baseline</b>, and a descender is simply a negative number. If letters are cut out
            of a grid with no baseline, the software has to guess where each one should sit — and the usual
            guess, aligning every letter by its own bounding box, puts the tail of a <i>g</i> level with the
            bottom of an <i>o</i>. That single mistake is what makes home-made fonts look wrong.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            With a printed baseline we do not guess. Every glyph is measured against the same two printed
            lines, using one scale for the whole sheet, so ascenders, x-height and descenders keep the exact
            proportions you wrote.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">What you get</h2>
          <ul className="mt-4 space-y-2.5 text-gray-600">
            <li><b className="text-ink">76 characters free.</b> A–Z, a–z, 0–9 and 14 punctuation marks — <span className="font-mono text-sm">. , ! ? &apos; &quot; - ( ) : ; &amp; @ #</span></li>
            <li><b className="text-ink">A real TTF.</b> Installs on Windows and macOS and works in Word, Canva, Photoshop — anywhere a font works.</li>
            <li><b className="text-ink">No account, no upload.</b> The photo is processed by JavaScript running on your own machine.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/create/" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
              I&apos;ve written mine — upload it →
            </Link>
            <Link href="/make-your-own-font/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
              How the whole thing works
            </Link>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Want to keep it, email it or take it to a print shop? Save it as a{' '}
            <Link href="/font-template-pdf/" className="font-semibold text-brand hover:underline">font template PDF</Link>{' '}
            — and see{' '}
            <Link href="/handwriting-to-font/" className="font-semibold text-brand hover:underline">handwriting to font</Link>{' '}
            for why each rule on this sheet exists.
          </p>
        </section>

        <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />

        <section className="mt-14 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold">Installing the font you make</h2>
          <p className="mt-2 leading-relaxed text-gray-600">
            On Windows, right-click the .ttf and choose Install — Microsoft&apos;s own instructions are in{' '}
            <a className="font-semibold text-brand hover:underline" href="https://support.microsoft.com/en-us/windows/experience/personalization/manage-fonts-in-windows" target="_blank" rel="noopener noreferrer">Manage fonts in Windows</a>.
            On a Mac, double-click the file and click Install, or use Font Book —{' '}
            <a className="font-semibold text-brand hover:underline" href="https://support.apple.com/guide/font-book/install-and-validate-fonts-fntbk1000/mac" target="_blank" rel="noopener noreferrer">Apple&apos;s Font Book guide</a>{' '}
            covers every method. Restart any app that was already open before it will see the new font.
          </p>
        </section>
        <RelatedLinks page="/font-template/" />
      </div>
    </>
  );
}
