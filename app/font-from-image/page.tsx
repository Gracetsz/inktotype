import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import { url, OG_IMAGE } from '@/lib/site';
import FromImageTool from '@/components/FromImageTool';
import { JsonLd, Faq, faqPage, softwareApp, howTo, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'Handwriting to font from a photo — no printer',
  description: 'Turn a photo of your handwriting into an installable TTF font. Write the alphabet on plain paper, photograph it, download the font. No printer, no account, nothing uploaded.',
  alternates: { canonical: url('/font-from-image/') },
  openGraph: {
    title: 'Turn a photo of your handwriting into a font',
    description: 'Plain paper, a phone camera, and a TTF at the end. Free, no account, nothing leaves your device.',
    url: url('/font-from-image/'),
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'Can I make a font from a photo of my handwriting?',
    a: 'Yes. Write the alphabet on plain paper with a dark pen, photograph it with a phone, and this page cuts each character out of the photo and assembles them into an installable TTF font. There is no printer, no account and no upload — the photo is processed by JavaScript running on your own machine.',
  },
  {
    q: 'How is this different from the printed template route?',
    a: 'The printed template has a baseline and an x-height line drawn inside every box, so the exact vertical position of each letter is measured rather than inferred. On plain paper those lines do not exist, so we work out the baseline from the shapes themselves — which requires that you tell us which characters are on each line. The result is very close, but the printed template is still the most precise route if you happen to have a printer.',
  },
  {
    q: 'What do I actually have to write?',
    a: 'Four lines: A–Z, then a–z, then 0–9, then the punctuation marks. You do not have to fit each group on a single line — if you run out of room, start a new line and add a matching line in the text boxes on this page. Writing large is better than cramming.',
  },
  {
    q: 'Why do I have to type out what I wrote?',
    a: 'Because the order is what tells us which blob in the photo is which character. On a printed template the box position carries that information; on plain paper nothing does. If the text you enter does not match the sheet — a missed character, an extra doodle — every character after that point is labelled with the wrong letter, and the mistake is silent. That is why the page shows you a thumbnail of every character with its label, so you can catch it in one scan.',
  },
  {
    q: 'What kind of photo works?',
    a: 'A flat, evenly lit phone photo taken from directly above. The page is forgiving about resolution and mild perspective, but not about three things: dark ink on white paper (pencil is too grey), characters that do not touch each other, and a clear gap between the lines of writing. Shadows falling across the page are the most common cause of a poor result.',
  },
  {
    q: 'I made a mistake halfway down the line. Do I start over?',
    a: 'No. Cross the mistake out, carry on writing, and put a ~ at that position in the line text. That tells us to throw the crossed-out blob away instead of counting it as a character. Without it every character after the crossing-out shifts by one.',
  },
  {
    q: 'Does my photo get uploaded anywhere?',
    a: 'No. Everything — decoding the photo, finding the lines of writing, cutting out the characters, tracing them into outlines and assembling the TTF — happens inside your browser. Nothing is sent to a server, there is no account, and we never see your handwriting. You can put the page in aeroplane mode after it loads and it still works.',
  },
  {
    q: 'What can I do with the font once I have it?',
    a: 'It is an ordinary TrueType font. Install it on Windows or macOS and it appears in Word, Google Docs, Canva, Photoshop, Figma and anything else that lists your system fonts. It covers 76 characters: A–Z, a–z, 0–9 and 14 punctuation marks.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={[
        softwareApp('Handwriting to font from a photo', 'Turn a photo of handwriting on plain paper into an installable TTF font, with no printer required.', '/font-from-image/'),
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Font from a photo', path: '/font-from-image/' }]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        howTo('Make a font from a photo of your handwriting', [
          { name: 'Write', text: 'Write A–Z, a–z, 0–9 and punctuation on plain white paper with a dark pen, one group per line, leaving gaps between characters.' },
          { name: 'Photograph', text: 'Take a flat, evenly lit photo of the whole sheet from directly above.' },
          { name: 'Tell us the lines', text: 'Type what you wrote on each line so each shape can be matched to the right character.' },
          { name: 'Review and download', text: 'Check each thumbnail against its label, then build and download your TTF.' },
        ]),
      ]} />
      <FromImageTool />

      <div className="no-print mx-auto max-w-3xl px-6 pb-16">
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">Converting handwriting to a font without a printer</h2>
          <p className="mt-3 leading-relaxed text-gray-600">
            Most tools that turn handwriting into a font start by asking you to print something. That is a
            reasonable request — a printed grid is the easiest way to know where every letter sits — but it
            rules out anyone without a printer, which is most people most of the time. This route removes that
            step. Plain paper, a pen you already own, and the camera in your pocket are enough.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            What you give up is a small amount of precision, and it is worth understanding where it goes. A font
            does not store letters as pictures; it stores each glyph in a coordinate system where{' '}
            <b>y = 0 is the baseline</b>. A descender is simply a negative number. Get the baseline wrong and the
            letters are all still there, but the <i>g</i> sits level with the <i>o</i> and the whole thing looks
            subtly broken — which is exactly what makes most home-made fonts look home-made.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            On the{' '}
            <Link href="/font-template/" className="font-semibold text-brand hover:underline">free printable font template</Link>{' '}
            that baseline is printed in every box, so it is measured. Here it has to be recovered from the writing
            itself: we group the ink into lines, find the dominant bottom edge of the letters in each line, and
            use the lowercase row to establish the x-height. That is why this page insists on knowing which
            characters you wrote and in what order — the identity of each shape is the prior that makes the whole
            reconstruction possible.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">The five things that decide whether it works</h2>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li><b className="text-ink">Dark ink, white paper.</b> Ballpoint, gel or fineliner with a medium tip. Pencil is grey, low-contrast and smudges; very fine 0.2 mm pens can vanish at photo resolution.</li>
            <li><b className="text-ink">Characters must not touch.</b> Two letters that touch are read as one shape and become one glyph. Leave a visible gap.</li>
            <li><b className="text-ink">A clear gap between lines.</b> The lines of writing are separated before anything else happens. Rows that overlap vertically get merged.</li>
            <li><b className="text-ink">Even light, no shadow.</b> A shadow across the page is the single most common cause of missing characters. Shoot near a window, not under a single overhead lamp with your phone between the lamp and the paper.</li>
            <li><b className="text-ink">Let the descenders hang.</b> Write <span className="font-mono">g p q y j</span> so they drop below the line you are writing on. If you float them, the font will float them too.</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">Which route should you use?</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 pr-4 font-semibold">Route</th>
                  <th className="py-3 pr-4 font-semibold">You need</th>
                  <th className="py-3 font-semibold">Best when</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4"><Link href="/create/" className="font-semibold text-brand hover:underline">Printed template</Link></td>
                  <td className="py-3 pr-4">Printer, pen, camera</td>
                  <td className="py-3">You want the most exact letter positions</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4"><b className="text-ink">From a photo</b> (this page)</td>
                  <td className="py-3 pr-4">Paper, pen, camera</td>
                  <td className="py-3">No printer, and you want your real pen handwriting</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4"><Link href="/draw/" className="font-semibold text-brand hover:underline">Draw in the browser</Link></td>
                  <td className="py-3 pr-4">Stylus or drawing tablet</td>
                  <td className="py-3">No paper at all, and you have an Apple Pencil or Wacom</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 leading-relaxed text-gray-600">
            All three produce the same thing: a 76-character TTF built entirely on your own machine. If you are
            not sure which fits you,{' '}
            <Link href="/make-your-own-font/" className="font-semibold text-brand hover:underline">how to make your own font from your handwriting</Link>{' '}
            walks through all three end to end.
          </p>
        </section>

        <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />

        <section className="mt-14 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold">Installing the font you make</h2>
          <p className="mt-2 leading-relaxed text-gray-600">
            On Windows, right-click the .ttf and choose Install — Microsoft&apos;s instructions are in{' '}
            <a className="font-semibold text-brand hover:underline" href="https://support.microsoft.com/en-us/windows/experience/personalization/manage-fonts-in-windows" target="_blank" rel="noopener noreferrer">Manage fonts in Windows</a>.
            On a Mac, double-click the file and click Install, or use Font Book —{' '}
            <a className="font-semibold text-brand hover:underline" href="https://support.apple.com/guide/font-book/install-and-validate-fonts-fntbk1000/mac" target="_blank" rel="noopener noreferrer">Apple&apos;s Font Book guide</a>{' '}
            covers every method. Restart any app that was already open before it will see the new font.
          </p>
        </section>
        <RelatedLinks page="/font-from-image/" />
      </div>
    </>
  );
}
