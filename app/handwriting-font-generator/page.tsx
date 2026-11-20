import type { Metadata } from 'next';
import Link from 'next/link';
import { url, OG_IMAGE } from '@/lib/site';
import RouteChooser from '@/components/RouteChooser';
import RelatedLinks from '@/components/RelatedLinks';
import { JsonLd, Faq, faqPage, softwareApp, howTo, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'Handwriting font generator — free, no sign-up',
  description: 'A free handwriting font generator that turns your writing into an installable TTF. Three ways in — printed template, phone photo, or stylus. 76 characters, no account, nothing uploaded.',
  alternates: { canonical: url('/handwriting-font-generator/') },
  openGraph: {
    title: 'Free handwriting font generator',
    description: 'Your handwriting in, an installable TTF out. 76 characters free, no account, nothing uploaded.',
    url: url('/handwriting-font-generator/'),
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'What is a handwriting font generator?',
    a: 'A tool that takes samples of your handwriting — one of each character — and assembles them into a real font file you can install and type with. This one produces a TrueType .ttf covering 76 characters, free, with no account, and it runs entirely in your browser.',
  },
  {
    q: 'Is this handwriting font generator really free?',
    a: 'Yes, for all 76 characters: A–Z, a–z, 0–9 and 14 punctuation marks. No sign-up, no watermark, no character limit, no paid tier gating the download.',
  },
  {
    q: 'How long does it take to generate a font?',
    a: 'About ten minutes, and almost all of that is you writing the alphabet. The generation itself takes a few seconds once your writing is in.',
  },
  {
    q: 'Do I need a scanner or special software?',
    a: 'No. A phone camera is enough, and there is nothing to install — the generator is a web page. If you have a stylus you do not even need paper or a camera.',
  },
  {
    q: 'What does the generator produce, and where does it work?',
    a: 'A standard TrueType font (.ttf). Install it on Windows or macOS and it appears in Word, Google Docs, Canva, Photoshop, Figma and anything else that lists your system fonts.',
  },
  {
    q: 'Does the generator upload my handwriting?',
    a: 'No. Reading the photo, cutting out the characters, tracing them and assembling the font all happen in your browser on your own machine. There is no account and no server copy — once the page has loaded you can go offline and it still finishes.',
  },
  {
    q: 'Can I generate more than one font?',
    a: 'Yes, as many as you like. There is no limit and no account to hit a quota on — write another sheet and run it again.',
  },
  {
    q: 'Will the generated font support cursive or accented characters?',
    a: 'Not properly. Joined-up cursive needs ligatures and accents need a larger character set, and this generator has neither — it makes one fixed shape per character across 76 characters. If you need those, Calligraphr Pro is the tool to pay for.',
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <JsonLd data={[
        softwareApp('Handwriting font generator', 'Generate an installable TTF font from your own handwriting, entirely in your browser.', '/handwriting-font-generator/'),
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Handwriting font generator', path: '/handwriting-font-generator/' }]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        howTo('Generate a font from your handwriting', [
          { name: 'Pick a route', text: 'Print a template, write on plain paper, or draw on screen with a stylus.' },
          { name: 'Write each character once', text: 'A–Z, a–z, 0–9 and punctuation, with a dark pen.' },
          { name: 'Feed it in', text: 'Photograph the sheet and upload it, or finish drawing on screen.' },
          { name: 'Generate and download', text: 'Review the characters, generate the font and download the TTF.' },
        ]),
      ]} />

      <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        Handwriting font generator
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
        Write the alphabet once, and get back a real font file in your own handwriting — installable,
        free, and generated on your own machine. No account, no watermark, nothing uploaded. Pick the
        route that matches what you have on hand.
      </p>

      <div className="mt-10">
        <RouteChooser />
      </div>

      <section className="mt-14 max-w-3xl">
        <h2 className="text-2xl font-extrabold tracking-tight">What this generator gives you</h2>
        <ul className="mt-4 space-y-3 text-gray-600">
          <li><b className="text-ink">76 characters, all free.</b> A–Z, a–z, 0–9 and 14 punctuation marks — <span className="font-mono text-sm">. , ! ? &apos; &quot; - ( ) : ; &amp; @ #</span>. Enough to type real sentences, which a font without punctuation cannot do.</li>
          <li><b className="text-ink">A real TrueType file.</b> Not an image, not a preview — a .ttf that installs like any other font and works in every app that reads your system fonts.</li>
          <li><b className="text-ink">Correct baselines.</b> Descenders hang, ascenders climb, and the x-height stays consistent. This is the part most home-made fonts get wrong, and it is why they look off without anyone being able to say why.</li>
          <li><b className="text-ink">No account, no upload.</b> The generator is JavaScript running in your browser. Your handwriting never reaches a server.</li>
          <li><b className="text-ink">No limit.</b> Generate as many fonts as you want, as many times as you want.</li>
        </ul>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-extrabold tracking-tight">What it does not do</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          Worth knowing before you spend ten minutes writing. This generator makes{' '}
          <b>one fixed shape per character</b>. That means no ligatures, so joined-up cursive will come out
          as separate letters that were drawn as if they would join; no multiple variants, so every{' '}
          <i>e</i> in a paragraph is identical in a way real handwriting never is; and 76 characters only,
          so accented vowels and non-Latin scripts are out of scope.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          If any of those matter to you,{' '}
          <Link href="/calligraphr-alternative/" className="font-semibold text-brand hover:underline">the comparison with Calligraphr</Link>{' '}
          lays out exactly where paying for their Pro plan is the better decision. For one font of your own
          everyday print handwriting in English — the common case — none of it comes up.
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-extrabold tracking-tight">Which route generates the best font?</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          The <Link href="/font-template/" className="font-semibold text-brand hover:underline">free printable font template</Link>,
          if you have a printer. Every box on it has a baseline and an x-height line printed inside, so
          each letter&apos;s vertical position is measured rather than inferred — and that measurement is
          the single biggest factor in whether the generated font looks right.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          Without a printer,{' '}
          <Link href="/font-from-image/" className="font-semibold text-brand hover:underline">generating a font from a photo</Link>{' '}
          of plain paper is very close behind — the baseline is reconstructed from your own letters instead
          of printed. With an Apple Pencil or drawing tablet,{' '}
          <Link href="/draw/" className="font-semibold text-brand hover:underline">drawing your font online</Link>{' '}
          gives exact metrics but a cleaner, less paper-like texture.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          If you want the reasoning rather than the recommendation,{' '}
          <Link href="/handwriting-to-font/" className="font-semibold text-brand hover:underline">how handwriting becomes a font</Link>{' '}
          explains what the generator is actually doing at each step and why the baseline decides
          everything.
        </p>
      </section>

      <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />
      <RelatedLinks page="/handwriting-font-generator/" />
    </main>
  );
}
