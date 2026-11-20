import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import { url, OG_IMAGE } from '@/lib/site';
import CreateWizard from '@/components/CreateWizard';
import { JsonLd, Faq, faqPage, softwareApp, howTo, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'Make your own font from your handwriting',
  description: 'Print a 76-box template, write your letters, photograph the sheet, and download an installable TTF font. Free, no account, everything runs in your browser.',
  alternates: { canonical: url('/create/') },
  openGraph: {
    title: 'Make your own font from your handwriting',
    description: 'Print, write, photograph, download a TTF. Free, no account, nothing uploaded.',
    url: url('/create/'),
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'How do I make my own font from my handwriting?',
    a: 'Print the free 76-box template, write one character per box with a dark pen, photograph the whole sheet, and upload the photo here. Your browser cuts each character out, traces it into an outline and assembles an installable TTF. It takes about ten minutes and costs nothing.',
  },
  {
    q: 'How long does it actually take?',
    a: 'Writing the sheet is the slow part — most people take five to eight minutes for all 76 characters. Printing, photographing and building the font take under two minutes between them. If you rush the writing it shows in the font, so this is the one step worth slowing down for.',
  },
  {
    q: 'Do I need to print at 100% scale?',
    a: 'No. The four black squares in the corners tell us the real printed size, so any scale works as long as the whole sheet with all four squares is in your photo. The sheet has a wide safety border so default printer margins cannot clip the squares.',
  },
  {
    q: 'What happens if some boxes fail?',
    a: 'The review screen flags them and you can redraw any individual character in the browser rather than reprinting the sheet. Characters you leave out are simply absent from the font — the other 70-odd still work.',
  },
  {
    q: 'Why does the review screen matter so much?',
    a: 'Because writing a character in the wrong box is the one mistake nothing can detect. That box has ink, it passes the quality check, and it is in the right position — so a d drawn in the b box becomes the letter b in your font, silently. Scanning the thumbnails against their labels once is the only place that gets caught.',
  },
  {
    q: 'Should I trace the grey letter printed in each box?',
    a: 'No. The grey character shows you where the letter should sit, not what it should look like. Trace it and you get a hand-drawn copy of our typeface instead of your own handwriting. You can switch the grey letters off before printing.',
  },
  {
    q: 'Is my handwriting uploaded to a server?',
    a: 'No. The photo is decoded, cut up, traced and assembled into a TTF by JavaScript running on your own machine. There is no account and no upload. Once the page has loaded you can go offline and the whole process still completes.',
  },
  {
    q: 'What if I do not have a printer?',
    a: 'Two other routes need no printer. You can write the alphabet on plain paper and photograph that, or write each character straight onto the screen with a stylus. Both produce the same 76-character TTF.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={[
        softwareApp('InkToType font maker', 'Turn a photo of a filled-in handwriting template into an installable TTF font.', '/create/'),
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Make my font', path: '/create/' }]),
        howTo('Make your own font from a handwriting template', [
          { name: 'Get the template', text: 'Print the free 76-box template on A4 paper.' },
          { name: 'Write', text: 'Write one character per box with a dark pen, sitting each letter on the printed baseline.' },
          { name: 'Upload a photo', text: 'Photograph the sheet with all four corner squares in frame and choose the file.' },
          { name: 'Review', text: 'Check each cut-out character matches its label, and redraw any that need it.' },
          { name: 'Download', text: 'Preview the font by typing, then download the TTF and install it.' },
        ]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
      ]} />
      <CreateWizard />

      <div className="no-print mx-auto max-w-3xl px-6 pb-16">
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">What happens to your photo</h2>
          <p className="mt-3 leading-relaxed text-gray-600">
            Four steps, all of them on your own machine. First the four black corner squares are located and
            the photo is un-warped, so a picture taken at an angle becomes a flat, square-on sheet — this is
            also what makes the print scale irrelevant, because the real size is solved from the markers
            themselves. Then the grid is cut into 76 boxes, each box is separated into ink and paper, and each
            patch of ink is traced into a vector outline. Finally those outlines are packed into a TrueType
            file with the right metrics.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            The step that matters most is one you cannot see: every glyph is measured against the{' '}
            <b>printed baseline</b> in its box, using one scale for the whole sheet. A font stores each glyph
            in a coordinate system where y = 0 is the baseline and a descender is a negative number. Tools
            that cut letters out of a plain grid have to guess that position, and the usual guess — align
            every letter by its own bounding box — puts the tail of a <i>g</i> level with the bottom of an{' '}
            <i>o</i>. That single mistake is what makes most home-made fonts look wrong. Here it is measured,
            not guessed.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">Writing the sheet well</h2>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li><b className="text-ink">Sit each letter on the solid line.</b> That line is the baseline, and it is the reference for everything. Floating a letter above it makes that one character sit high in the font.</li>
            <li><b className="text-ink">Let g p q y j drop below it.</b> Descenders are supposed to hang. Write them the way you normally would.</li>
            <li><b className="text-ink">Use a medium-tip dark pen.</b> Ballpoint, gel or fineliner. Pencil is too grey and it smudges; 0.2 mm pens can disappear at photo resolution.</li>
            <li><b className="text-ink">Stay inside the box.</b> Ink that crosses into the neighbouring box gets cut off at the border.</li>
            <li><b className="text-ink">Write it once, normally.</b> Carefully drawing each letter produces a font that looks like careful drawing. The point is to capture your hand, not your best calligraphy.</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">Before you photograph it</h2>
          <p className="mt-3 leading-relaxed text-gray-600">
            All four black corner squares must be completely inside the frame — that is the one hard
            requirement, and the most common reason an upload fails. Lay the sheet flat, shoot from directly
            above, and use even light. A shadow falling across the page, or your own phone shadowing the
            paper under an overhead lamp, will cost you characters. Resolution and mild perspective are
            forgiving; missing corners and shadows are not.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/font-template/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
              Get the free printable font template
            </Link>
            <Link href="/font-from-image/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
              No printer? Use a photo instead
            </Link>
          </div>
        </section>

        <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />

        <section className="mt-14 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold">Installing your font</h2>
          <p className="mt-2 leading-relaxed text-gray-600">
            On Windows, right-click the .ttf and choose Install — see{' '}
            <a className="font-semibold text-brand hover:underline" href="https://support.microsoft.com/en-us/windows/experience/personalization/manage-fonts-in-windows" target="_blank" rel="noopener noreferrer">Manage fonts in Windows</a>.
            On a Mac, double-click and click Install, or use{' '}
            <a className="font-semibold text-brand hover:underline" href="https://support.apple.com/guide/font-book/install-and-validate-fonts-fntbk1000/mac" target="_blank" rel="noopener noreferrer">Font Book</a>.
            Restart any app that was already open before it will see the new font. After that it works
            anywhere a font works — Word, Google Docs, Canva, Photoshop, Figma.
          </p>
        </section>
        <RelatedLinks page="/create/" />
      </div>
    </>
  );
}
