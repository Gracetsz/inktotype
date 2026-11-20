import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import { url, OG_IMAGE } from '@/lib/site';
import { JsonLd, Faq, faqPage, howTo, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'Handwriting to font — turn your writing into a TTF',
  description: 'How to convert handwriting into a real font: what actually happens to your letters, the three ways to capture them, and the mistakes that make home-made fonts look wrong. Free, in your browser.',
  alternates: { canonical: url('/handwriting-to-font/') },
  openGraph: {
    title: 'Handwriting to font — how it actually works',
    description: 'Turn handwriting into an installable TTF. What the software does, and what makes the difference between good and wrong.',
    url: url('/handwriting-to-font/'),
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'How do I turn my handwriting into a font?',
    a: 'Write every character you want once, capture it, and let software cut each character out and trace it into an outline. On this site you can capture your writing three ways — a printed template, a photo of plain paper, or a stylus on screen — and you get an installable TTF at the end. It takes about ten minutes and is free for all 76 characters.',
  },
  {
    q: 'Can you convert handwriting to a font from a photo?',
    a: 'Yes. A phone photo of the alphabet written on plain paper is enough. The hard part is not reading the letters — it is knowing where the baseline is, because a font stores each glyph relative to it. Photo-based tools solve that either by printing a baseline for you to write on, or by working it out from the shapes once you say which characters you wrote.',
  },
  {
    q: 'Is converting handwriting into a font free?',
    a: 'Here, yes, for all 76 characters — A–Z, a–z, 0–9 and 14 punctuation marks, with no account and no watermark. Elsewhere it varies: Calligraphr, the best-known tool in this space, caps its free plan at 75 characters per font and charges $10 for a month of Pro.',
  },
  {
    q: 'Why do home-made handwriting fonts often look wrong?',
    a: 'Almost always because of the baseline. A font does not store letters as pictures — it stores each glyph in a coordinate system where y = 0 is the baseline, and a descender is a negative number. If the software aligns every letter by its own bounding box instead, the tail of a g ends up level with the bottom of an o. Every letter is present and correct, and the whole thing still looks broken.',
  },
  {
    q: 'How many characters do I need to write?',
    a: 'For English, 76 covers everything you normally type: 26 uppercase, 26 lowercase, 10 digits and 14 punctuation marks. You can write fewer — missing characters are simply absent from the font — but leaving out punctuation is the omission people regret, because a font with no comma or full stop is unusable for real text.',
  },
  {
    q: 'What file format do I get?',
    a: 'A TrueType font (.ttf). It installs on Windows and macOS the same way any font does, and then appears in Word, Google Docs, Canva, Photoshop, Figma and anything else that lists your system fonts.',
  },
  {
    q: 'Will the font look exactly like my handwriting?',
    a: 'It will look like your handwriting one letter at a time, which is close but not identical to how you actually write. Real handwriting varies — the same letter comes out differently depending on what precedes it, and letters join. A font has one fixed shape per character, so the result reads as your hand but more regular. Tools with multiple variants per character narrow that gap; this one does not.',
  },
  {
    q: 'Does my handwriting get uploaded to a server?',
    a: 'Not here. Every step runs as JavaScript in your browser on your own machine — decoding the photo, cutting out the characters, tracing them and assembling the TTF. There is no account and no upload. Other tools differ, so it is worth checking if that matters to you.',
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={[
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Handwriting to font', path: '/handwriting-to-font/' }]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        howTo('Convert handwriting to a font', [
          { name: 'Choose how to capture your writing', text: 'A printed template, a photo of plain paper, or a stylus on screen.' },
          { name: 'Write every character once', text: 'A–Z, a–z, 0–9 and punctuation, sitting each letter on the baseline.' },
          { name: 'Let the letters be cut out and traced', text: 'Each character is separated from the paper and traced into a vector outline.' },
          { name: 'Download and install the TTF', text: 'Install the font on Windows or macOS and type with it anywhere.' },
        ]),
      ]} />

      <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
        Handwriting to font: how it actually works
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-gray-600">
        You can turn your handwriting into a real, installable font in about ten minutes, for free, without
        design software. This page explains what the software is actually doing with your letters — because
        understanding that one thing is the difference between a font that looks like your handwriting and a
        font that looks like a ransom note.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/create/" className="rounded-xl bg-brand px-7 py-3.5 font-semibold text-white hover:bg-brand-dark">
          Make my font — free
        </Link>
        <Link href="/font-from-image/" className="rounded-xl bg-brand-light px-7 py-3.5 font-semibold text-brand">
          No printer? Start here
        </Link>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">A font is not a picture of letters</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          This is the idea everything else depends on. A TrueType font does not store an image of an{' '}
          <i>a</i>. It stores a set of curves in a coordinate system, and in that coordinate system{' '}
          <b>y = 0 is the baseline</b> — the invisible line letters sit on. An <i>o</i> sits just above zero.
          The tail of a <i>g</i> goes below zero, into negative numbers. The stem of an <i>h</i> climbs well
          above the height of an <i>x</i>.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          So converting handwriting to a font is not really an image problem. Separating ink from paper is
          the easy part — any threshold does it. The problem is that a photograph of your alphabet contains
          no information about where y = 0 is. Software has to get that from somewhere, and how it gets it
          is what separates the tools.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          The tempting shortcut is to align every letter by its own bounding box: put the bottom of each
          cut-out shape at the baseline. It is simple, it needs no extra information, and it is wrong. Under
          that rule the tail of a <i>g</i> sits level with the bottom of an <i>o</i>, the dot of an{' '}
          <i>i</i> floats at cap height, and commas hover mid-line. Every letter is individually correct and
          the text still looks broken. If you have ever made a handwriting font and felt that something was
          off without being able to name it, this was almost certainly it.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Three ways to get your letters in</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          They differ almost entirely in how they answer the baseline question.
        </p>

        <h3 className="mt-8 text-lg font-bold">1. A printed template — the baseline is measured</h3>
        <p className="mt-2 leading-relaxed text-gray-600">
          You print a grid where every box already has a baseline and an x-height line drawn in it, and you
          write on those lines. Now nothing has to be inferred: each glyph is measured against a known line,
          using one scale for the whole sheet, so ascenders, x-height and descenders keep the proportions you
          actually wrote. This is the most accurate route, and the only cost is owning a printer. The{' '}
          <Link href="/font-template/" className="font-semibold text-brand hover:underline">free printable font template</Link>{' '}
          here has 76 boxes and takes one sheet of A4.
        </p>

        <h3 className="mt-8 text-lg font-bold">2. A photo of plain paper — the baseline is reconstructed</h3>
        <p className="mt-2 leading-relaxed text-gray-600">
          No printer, no grid: write the alphabet on any paper and photograph it. The baseline is recovered
          from the writing itself — the ink is grouped into lines, the dominant bottom edge of each line
          gives the baseline, and the lowercase row establishes the x-height. This only works if the software
          knows <i>which</i> character each shape is, which is why{' '}
          <Link href="/font-from-image/" className="font-semibold text-brand hover:underline">the photo route</Link>{' '}
          asks you to type out what you wrote on each line. Slightly less exact than a printed grid, and it
          works with a pen and paper you already have.
        </p>

        <h3 className="mt-8 text-lg font-bold">3. A stylus on screen — the baseline is the canvas</h3>
        <p className="mt-2 leading-relaxed text-gray-600">
          With an Apple Pencil or a drawing tablet you write directly into the coordinate system the font
          will use. The baseline is a real line on the pad, so the metrics are exact and nothing can be
          distorted by lighting, perspective or print scale. What you give up is texture: a font{' '}
          <Link href="/draw/" className="font-semibold text-brand hover:underline">drawn on glass</Link>{' '}
          is cleaner and more even than the same hand on paper, and some of what reads as{' '}
          <i>handwriting</i> lives in that unevenness.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">What happens after your letters are in</h2>
        <ol className="mt-4 space-y-3 text-gray-600">
          <li><b className="text-ink">1 · Separate ink from paper.</b> Each character is reduced to a mask of ink pixels. Shadows and grey pencil are what break this step, which is why every guide insists on a dark pen and even light.</li>
          <li><b className="text-ink">2 · Trace the outline.</b> The mask is converted from pixels into vector curves. This is what makes the font scale — the same file works at 12 pt and on a poster.</li>
          <li><b className="text-ink">3 · Place it against the baseline.</b> The step everything above was about.</li>
          <li><b className="text-ink">4 · Set the spacing.</b> Each glyph gets a width, which decides how letters sit next to each other. Get it wrong and words look either cramped or scattered.</li>
          <li><b className="text-ink">5 · Assemble the TTF.</b> The outlines and metrics are packed into a font file your operating system can install.</li>
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Four mistakes worth avoiding</h2>
        <ul className="mt-4 space-y-3 text-gray-600">
          <li><b className="text-ink">Writing too carefully.</b> The most common one. Slowly drawing each letter produces a font that looks like careful drawing, not like you. Write the way you write.</li>
          <li><b className="text-ink">Using pencil.</b> Graphite is grey, low-contrast and smudges. It is the single most reliable way to lose characters.</li>
          <li><b className="text-ink">Letting characters touch.</b> Two shapes that touch are read as one glyph. Leave a visible gap.</li>
          <li><b className="text-ink">Skipping punctuation.</b> Uppercase and lowercase feel like the real work, so people stop there — and end up with a font that cannot write a sentence with a full stop in it.</li>
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-extrabold tracking-tight">Ready to make one?</h2>
        <p className="mt-2 leading-relaxed text-gray-600">
          All three routes are free here and produce the same 76-character TTF, built entirely on your own
          machine. If you have a printer, start with the template — it gives the best result.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/font-template/" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
            Get the free printable font template
          </Link>
          <Link href="/how-to-install-a-font/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
            How to install the font afterwards
          </Link>
        </div>
      </section>

      <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />
      <RelatedLinks page="/handwriting-to-font/" />
    </main>
  );
}
