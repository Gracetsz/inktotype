import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import { url, OG_IMAGE } from '@/lib/site';
import DrawPad from '@/components/DrawPad';
import { JsonLd, Faq, faqPage, softwareApp, howTo, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'Draw your own font online with a stylus',
  description: 'Write each character straight onto the screen with an Apple Pencil, drawing tablet or finger, and download an installable TTF. No printer, no camera, no account.',
  alternates: { canonical: url('/draw/') },
  openGraph: {
    title: 'Draw your own font in the browser',
    description: 'Apple Pencil or drawing tablet in, installable TTF out. Free, nothing uploaded.',
    url: url('/draw/'),
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'Can I draw my own font online?',
    a: 'Yes. This page gives you a writing pad with a baseline and an x-height line printed on it. Write each of the 76 characters once with a stylus, drawing tablet or finger, and download an installable TTF at the end. Nothing is printed, photographed or uploaded.',
  },
  {
    q: 'Do I need an Apple Pencil?',
    a: 'No, but it makes a large difference. Any pressure-sensitive stylus works — Apple Pencil, a Wacom pen, a Samsung S Pen, an MPP stylus on a Surface. Pressure is mapped to stroke width, so a stylus gives you thick and thin strokes the way a real pen would. A finger works and a mouse works, but a mouse in particular produces strokes that look drawn rather than written.',
  },
  {
    q: 'Will my palm resting on the screen ruin it?',
    a: 'No. Palm rejection switches on automatically the moment a pen touches the pad — after that, touch input is ignored and only the stylus draws. You do not have to turn anything on.',
  },
  {
    q: 'How is this different from photographing handwriting on paper?',
    a: 'The metrics are exact here. Nothing is photographed, so nothing can be distorted by perspective, lighting or print scale, and the baseline is a real line on the pad rather than something reconstructed from the shapes. What you give up is the character of a real pen on real paper — ink pooling, paper texture, the small inconsistencies that make handwriting look handwritten.',
  },
  {
    q: 'How many characters do I have to draw?',
    a: '76: A–Z, a–z, 0–9 and 14 punctuation marks. You can skip any you do not need — they are simply absent from the finished font, and the rest still work. Most people take ten to fifteen minutes for the full set.',
  },
  {
    q: 'What do the two lines on the pad mean?',
    a: 'The solid line is the baseline: sit each letter on it, and let g, p, q, y and j hang below it. The dashed line is the x-height — the top of a lowercase x. Keeping your lowercase letters consistent against that line is what makes the finished font look even rather than ransom-note.',
  },
  {
    q: 'Can I redo a character I am not happy with?',
    a: 'Yes, at any point. Navigate back to it and clear the pad, or redraw over it. Nothing is final until you build the font, and you can rebuild as many times as you like without starting over.',
  },
  {
    q: 'Does anything get uploaded?',
    a: 'No. The strokes stay in your browser, the font is assembled in your browser, and the TTF is saved straight to your downloads folder. There is no account and no server involved in making the font.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={[
        softwareApp('Draw your own font online', 'Write each character on screen with a stylus or drawing tablet and download an installable TTF font.', '/draw/'),
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Draw in the browser', path: '/draw/' }]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        howTo('Draw your own font in the browser', [
          { name: 'Pick up a stylus', text: 'Use an Apple Pencil, drawing tablet, S Pen or your finger. Palm rejection turns on automatically.' },
          { name: 'Write each character', text: 'Write all 76 characters once, sitting each on the solid baseline and letting descenders hang below it.' },
          { name: 'Build', text: 'Build the font and preview it by typing a sample sentence.' },
          { name: 'Download', text: 'Download the TTF and install it on Windows or macOS.' },
        ]),
      ]} />
      <DrawPad />

      <div className="no-print mx-auto max-w-3xl px-6 pb-16">
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">The route with no paper in it</h2>
          <p className="mt-3 leading-relaxed text-gray-600">
            The other two ways of making a font here start with ink on paper and end with a camera. This one
            skips both. You write directly into the coordinate system the font will use, which removes every
            source of error that lives between the pen and the file: no print scale to solve, no perspective
            to un-warp, no shadow to confuse the ink from the paper, no character accidentally written in the
            wrong box.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            That precision is the reason to choose this route, and the trade is worth being honest about. A
            font drawn on glass looks like a font drawn on glass. Strokes are cleaner and more even than a
            real pen&apos;s, and the small irregularities that read as <i>handwriting</i> — ink pooling at a
            change of direction, a letter that came out slightly differently because it was the fortieth one
            you wrote — are mostly absent. If you want your actual handwriting, the{' '}
            <Link href="/font-template/" className="font-semibold text-brand hover:underline">printed font template</Link>{' '}
            or the{' '}
            <Link href="/font-from-image/" className="font-semibold text-brand hover:underline">photo route</Link>{' '}
            will get closer. If you want a clean, controlled hand-lettered font — or you simply have an iPad
            and no printer — draw it here.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">What you write on</h2>
          <p className="mt-3 leading-relaxed text-gray-600">
            A font does not store letters as pictures. It stores each glyph in a coordinate system where{' '}
            <b>y = 0 is the baseline</b>, and a descender is simply a negative number. The solid line on the
            pad is that y = 0. Everything you draw is measured against it, which is why sitting each letter
            on the line matters more than drawing it beautifully — a gorgeous <i>g</i> that floats above the
            baseline will float in every word you ever type.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            The dashed line above it is the x-height. Lowercase letters without ascenders — a, c, e, m, n, o,
            r, s — should reach it and stop. Consistency against that one line does more for how the finished
            font looks than the quality of any individual letter.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">Devices, ranked by how well they work</h2>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li><b className="text-ink">iPad + Apple Pencil.</b> The best combination available. Pressure and low latency both work, and the result is close to writing on paper.</li>
            <li><b className="text-ink">Drawing tablet (Wacom, Huion, XP-Pen).</b> Just as accurate, though writing while looking at a separate screen takes a few characters to get used to. Screen tablets avoid that entirely.</li>
            <li><b className="text-ink">Android tablet with S Pen, or a Surface with a pen.</b> Pressure is supported and results are good.</li>
            <li><b className="text-ink">A finger on a touchscreen.</b> Works, and is fine for a deliberately chunky, casual font. Fine detail is hard.</li>
            <li><b className="text-ink">Mouse or trackpad.</b> Works, but expect the result to look drawn rather than written. If this is all you have, the photo route will almost certainly give you a nicer font.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/font-from-image/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
              Use a photo of real handwriting instead
            </Link>
            <Link href="/make-your-own-font/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
              Compare all three routes
            </Link>
          </div>
        </section>

        <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />

        <section className="mt-14 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold">Installing the font you make</h2>
          <p className="mt-2 leading-relaxed text-gray-600">
            On Windows, right-click the .ttf and choose Install — see{' '}
            <a className="font-semibold text-brand hover:underline" href="https://support.microsoft.com/en-us/windows/experience/personalization/manage-fonts-in-windows" target="_blank" rel="noopener noreferrer">Manage fonts in Windows</a>.
            On a Mac, double-click and click Install, or use{' '}
            <a className="font-semibold text-brand hover:underline" href="https://support.apple.com/guide/font-book/install-and-validate-fonts-fntbk1000/mac" target="_blank" rel="noopener noreferrer">Font Book</a>.
            Restart any app that was already open before it will see the new font.
          </p>
        </section>
        <RelatedLinks page="/draw/" />
      </div>
    </>
  );
}
