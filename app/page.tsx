import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import RouteChooser from '@/components/RouteChooser';
import { JsonLd, Faq, faqPage, softwareApp, howTo, breadcrumb } from '@/components/Seo';
import { url } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Create your own font from your handwriting — free',
  description: 'Make your own font in four steps: print a template, write, snap a photo, download a TTF. Runs in your browser — your handwriting never leaves your device.',
  alternates: { canonical: url('/') },
};

const FAQ = [
  {
    q: 'How do I turn my handwriting into a font?',
    a: 'Write the alphabet once — on a printed template, on plain paper, or straight onto the screen with a stylus — and this site cuts each character out, traces it into an outline and assembles an installable TTF font. It takes about ten minutes, costs nothing, and needs no account.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes, for all 76 characters: A–Z, a–z, 0–9 and 14 punctuation marks. There is no sign-up, no watermark, no character limit and no paid tier gating the download.',
  },
  {
    q: 'Do I need a printer?',
    a: 'No. The printed template gives the most exact letter positions, but two other routes need no printer at all: photograph handwriting on plain paper, or write each character in the browser with a stylus or drawing tablet.',
  },
  {
    q: 'Where does my handwriting go?',
    a: 'Nowhere. Every step — decoding the photo, straightening it, cutting out the characters, tracing them and assembling the TTF — runs in your browser on your own machine. Nothing is uploaded, there is no server copy, and there is no account. Close the tab and nothing of yours remains anywhere.',
  },
  {
    q: 'What file do I get, and where does it work?',
    a: 'An ordinary TrueType (.ttf) font. Install it on Windows or macOS and it appears in Word, Google Docs, Canva, Photoshop, Figma and anything else that lists your system fonts.',
  },
  {
    q: 'How long does it take?',
    a: 'About ten minutes, and most of that is writing. Printing, photographing and building the font take under two minutes between them.',
  },
];

const STEPS = [
  ['Print', 'One A4 sheet, 76 boxes.'],
  ['Write', 'A–Z, a–z, 0–9 and punctuation, with any dark pen.'],
  ['Snap', 'A phone photo is enough. Angle and shadows are fine.'],
  ['Type', 'Install the TTF and type in Word, Canva, anywhere.'],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6">
      <JsonLd data={[
        softwareApp('InkToType', 'Turn your handwriting into an installable TTF font, entirely in your browser.', '/'),
        breadcrumb([{ name: 'Home', path: '/' }]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        howTo('Turn your handwriting into a font', [
          { name: 'Print', text: 'Print the free 76-box font template on one sheet of A4.' },
          { name: 'Write', text: 'Write A–Z, a–z, 0–9 and punctuation with any dark pen, one character per box.' },
          { name: 'Photograph', text: 'Take a phone photo of the whole sheet with all four corner squares in frame.' },
          { name: 'Download', text: 'Review the cut-out characters and download your installable TTF font.' },
        ]),
      ]} />
      <section className="grid items-center gap-11 py-16 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Create your own font <em className="not-italic text-brand">from your handwriting</em>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            Print a template, write your letters, take a photo. A few seconds later you have a real
            installable font that looks exactly like you wrote it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/create/" className="rounded-xl bg-brand px-7 py-3.5 font-semibold text-white hover:bg-brand-dark">
              Make my font — free
            </Link>
            <Link href="/font-from-image/" className="rounded-xl bg-brand-light px-7 py-3.5 font-semibold text-brand">
              No printer? Start here
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>✓ 76 characters free</span>
            <span>✓ No account</span>
            <span>✓ Nothing is uploaded</span>
          </div>
        </div>
        <div
          className="rotate-1 rounded-2xl border border-brand-mid p-7 shadow-2xl"
          style={{ background: 'repeating-linear-gradient(#fff,#fff 34px,#efe9f9 35px)' }}
        >
          <p className="text-3xl leading-9 text-brand-ink" style={{ fontFamily: 'Caveat, cursive' }}>
            This sentence is not a font preview —<br />it is what your own font could look<br />like once you have made it.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 py-16">
        <RouteChooser />
      </section>

      <section className="border-t border-gray-200 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Print. Write. Snap. Type.</h2>
        <p className="mt-2 text-center text-gray-500">Four steps, about ten minutes, no software to install.</p>
        <div className="mt-9 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <div key={title} className="rounded-2xl border border-gray-200 p-5">
              <div className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 py-16">
        <h2 className="text-3xl font-extrabold tracking-tight">Your handwriting never leaves your device</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-gray-600">
          The photo is decoded, straightened, cut into letters, traced and assembled into a font
          entirely inside your browser. There is no upload, no server copy, and no account — close
          the tab and nothing of yours remains anywhere.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/create/" className="rounded-xl bg-brand px-7 py-3.5 font-semibold text-white hover:bg-brand-dark">
            Start now →
          </Link>
          <Link href="/make-your-own-font/" className="rounded-xl bg-brand-light px-7 py-3.5 font-semibold text-brand">
            How it works
          </Link>
        </div>
      </section>

      <section className="border-t border-gray-200 py-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight">Three ways to make your own font</h2>
          <p className="mt-3 leading-relaxed text-gray-600">
            All three end in the same place — a 76-character TTF built entirely on your own machine — and
            they differ only in how your letters get in.
          </p>
          <ul className="mt-6 space-y-4 text-gray-600">
            <li>
              <b className="text-ink">
                <Link href="/font-template/" className="text-brand hover:underline">The printed font template</Link>
              </b>{' '}
              is the most exact. Every box has a baseline and an x-height line printed inside it, so the
              vertical position of each letter is measured rather than inferred. That one detail is the
              difference between a font where the tail of a <i>g</i> hangs properly and one where it sits
              level with an <i>o</i>.
            </li>
            <li>
              <b className="text-ink">
                <Link href="/font-from-image/" className="text-brand hover:underline">Handwriting to font from a photo</Link>
              </b>{' '}
              needs no printer — plain paper and a phone camera are enough. The baseline is reconstructed
              from the writing itself, which is why this route asks you to say which characters you wrote.
            </li>
            <li>
              <b className="text-ink">
                <Link href="/draw/" className="text-brand hover:underline">Drawing your own font online</Link>
              </b>{' '}
              needs no paper either. With an Apple Pencil or drawing tablet you write straight into the
              coordinate system the font will use, so the metrics are exact — at the cost of the texture a
              real pen on real paper gives you.
            </li>
          </ul>
          <p className="mt-5 leading-relaxed text-gray-600">
            Not sure which one fits?{' '}
            <Link href="/make-your-own-font/" className="font-semibold text-brand hover:underline">
              How to make your own font from your handwriting
            </Link>{' '}
            walks through all three end to end.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 py-16">
        <div className="max-w-3xl">
          <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />
        </div>
      </section>
      <RelatedLinks page="/" />
    </main>
  );
}
