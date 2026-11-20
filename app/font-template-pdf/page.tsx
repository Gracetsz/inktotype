import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import { url, OG_IMAGE } from '@/lib/site';
import { JsonLd, Faq, faqPage, howTo, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'Font template PDF — save, print and share the sheet',
  description: 'Save the free 76-box font template as a PDF: print-to-PDF steps for Windows and macOS, A4 vs Letter, printing at a copy shop, and running it with a class.',
  alternates: { canonical: url('/font-template-pdf/') },
  openGraph: {
    title: 'Font template PDF — save, print and share',
    description: 'Turn the free 76-box handwriting font template into a PDF you can keep, email or take to a print shop.',
    url: url('/font-template-pdf/'),
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'How do I get the font template as a PDF?',
    a: 'Open the template page and print it, then choose "Save as PDF" instead of a printer — Microsoft Print to PDF on Windows, or the PDF button in the macOS print dialog. The sheet is generated in your browser rather than served as a file, so print-to-PDF is how you get a copy you can keep, email or take to a print shop.',
  },
  {
    q: 'Is the template A4 or Letter?',
    a: 'It is laid out for A4, but it prints correctly on US Letter too. The four black squares in the corners tell the software the sheet\'s real printed size, so it solves the scale rather than assuming it. Print at whatever your printer defaults to — just make sure all four squares survive onto the paper.',
  },
  {
    q: 'Do I have to print at 100% scale?',
    a: 'No. Scale is solved from the corner markers, so "Fit to page", "Shrink to fit" and Letter-vs-A4 differences are all fine. The only fatal setting is one that crops a corner marker off the page.',
  },
  {
    q: 'The black squares are missing from my print preview. What do I do?',
    a: 'Set Margins to None and tick "Background graphics" in the print dialog, then check the preview again. Without all four squares the sheet cannot be processed, and you would only discover that after writing on it — so it is worth checking before you print rather than after.',
  },
  {
    q: 'Can I print several copies for a class or a group?',
    a: 'Yes. The template is free with no account and no per-copy limit, so print as many as you like. Each person needs their own sheet, since a font is built from one sheet of one person\'s handwriting.',
  },
  {
    q: 'Can I turn the grey guide letters off before saving the PDF?',
    a: 'Yes, there is a toggle on the template page. The grey character shows where a letter should sit, not what it should look like — some people find it helpful and others find it tempting to trace, which produces a copy of our typeface instead of their handwriting.',
  },
  {
    q: 'Does the PDF work with other handwriting-font tools?',
    a: 'No, and this is worth being clear about. The corner markers and the box positions are specific to this site\'s processing. A template from another tool will not work here either. Use the sheet with the tool it came from.',
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={[
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Font template PDF', path: '/font-template-pdf/' }]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        howTo('Save the font template as a PDF', [
          { name: 'Open the template', text: 'Go to the free 76-box font template page.' },
          { name: 'Open the print dialog', text: 'Press Ctrl+P on Windows or Cmd+P on macOS.' },
          { name: 'Choose PDF instead of a printer', text: 'Pick "Microsoft Print to PDF" on Windows, or use the PDF menu in the macOS print dialog.' },
          { name: 'Check all four corner squares', text: 'Confirm the four black squares appear in the preview before saving.' },
          { name: 'Save', text: 'Save the PDF and print it whenever you need a fresh sheet.' },
        ]),
      ]} />

      <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
        Font template PDF
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-gray-600">
        The 76-box handwriting font template is generated in your browser, which is what keeps it free and
        account-free — but it also means there is no file sitting on a server for you to download. If you
        want a PDF you can keep, email to someone, or hand to a print shop, you make it yourself in about
        five seconds with print-to-PDF. Here is how, plus the paper-size and printing questions that come up
        afterwards.
      </p>

      <div className="mt-7">
        <Link href="/font-template/" className="inline-block rounded-xl bg-brand px-7 py-3.5 font-semibold text-white hover:bg-brand-dark">
          Open the free printable font template
        </Link>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">Saving it as a PDF</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          Open the{' '}
          <Link href="/font-template/" className="font-semibold text-brand hover:underline">font template</Link>{' '}
          and press <b>Ctrl+P</b> (Windows) or <b>Cmd+P</b> (macOS). Then:
        </p>
        <ul className="mt-4 space-y-3 text-gray-600">
          <li><b className="text-ink">Windows.</b> In the Destination or Printer list, choose <b>Microsoft Print to PDF</b> — or, in Chrome and Edge, <b>Save as PDF</b>. Click Print and pick where to save it.</li>
          <li><b className="text-ink">macOS.</b> Use the <b>PDF</b> menu at the bottom-left of the print dialog and choose <b>Save as PDF</b>. In Chrome, the Destination list has <b>Save as PDF</b> directly.</li>
          <li><b className="text-ink">Before you save, look at the preview.</b> All four black corner squares must be on the page. If any are missing, set <b>Margins</b> to <b>None</b> and tick <b>Background graphics</b>, then check again.</li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-600">
          That last point is the only one that really matters. Those squares are how the sheet&apos;s real
          size and angle are recovered from your photo — the reason print scale does not have to be exact.
          A sheet missing a corner marker cannot be processed, and you would find that out only after
          spending ten minutes writing on it.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">A4, Letter, and printing somewhere else</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          The sheet is laid out for A4 and prints fine on US Letter. Because the corner markers carry the
          real size, the software solves the scale from the sheet itself instead of assuming it — so
          &ldquo;Fit to page&rdquo;, &ldquo;Shrink to fit&rdquo;, a slightly different paper size and a
          printer that quietly scales everything by 4% are all harmless. There is a wide safety border for
          exactly this reason.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          A PDF is also the practical format if you are not printing at home. Copy shops, libraries and
          office printers all take a PDF on a USB stick or by email without touching the layout, which is
          not something you can rely on when sending a web page to print on someone else&apos;s machine.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Using it with a group</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          A saved PDF is the easiest way to run this with a class, a workshop or a family. Print one sheet
          per person — a font is built from one person&apos;s handwriting on one sheet, so they cannot be
          shared or combined. There is no account, no per-copy limit and no cost, so the only constraint is
          your paper.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          Two things worth saying out loud before people start writing: use a dark pen rather than a pencil,
          and write normally rather than beautifully. Careful drawing produces a font that looks like
          careful drawing. The{' '}
          <Link href="/font-template/" className="font-semibold text-brand hover:underline">template page</Link>{' '}
          has the full list, and{' '}
          <Link href="/handwriting-to-font/" className="font-semibold text-brand hover:underline">handwriting to font</Link>{' '}
          explains why each rule exists.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-extrabold tracking-tight">Written your sheet already?</h2>
        <p className="mt-2 leading-relaxed text-gray-600">
          Photograph it with all four black squares in frame, upload it, and you will have an installable
          TTF a few seconds later.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/create/" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
            Upload my sheet →
          </Link>
          <Link href="/font-from-image/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
            No printer at all? Use plain paper
          </Link>
        </div>
      </section>

      <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />
      <RelatedLinks page="/font-template-pdf/" />
    </main>
  );
}
