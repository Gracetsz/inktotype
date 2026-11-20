import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import { SITE_NAME, CONTACT_EMAIL, url } from '@/lib/site';
import { JsonLd, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'About',
  description: 'InkToType turns your handwriting into an installable TTF font entirely inside your browser. Why it never uploads anything, and what it cannot do.',
  alternates: { canonical: url('/about/') },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <JsonLd data={breadcrumb([{ name: 'Home', path: '/' }, { name: 'About', path: '/about/' }])} />
      <h1 className="text-3xl font-extrabold tracking-tight">About {SITE_NAME}</h1>

      <p className="mt-5 leading-relaxed text-gray-600">
        {SITE_NAME} turns your handwriting into a real, installable font file. Write the alphabet once,
        capture it, and get a TTF that works in Word, Canva, Photoshop or anywhere else a font works.
      </p>

      <h2 className="mt-10 text-xl font-bold">Why it all runs in your browser</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        Every step — straightening the photo, cutting out each character, tracing the outlines, assembling the
        font file — is JavaScript running on your own machine. Nothing is uploaded. There is no server holding
        a copy of your handwriting, because there is no server.
      </p>
      <p className="mt-3 leading-relaxed text-gray-600">
        That was a deliberate choice, and not only for privacy. Your handwriting is unusually personal data:
        it is on your cheques, your signature and your children&apos;s birthday cards. A tool that asks you to
        upload all 76 characters of it has to be trusted. A tool that never receives it does not.
      </p>

      <h2 className="mt-10 text-xl font-bold">Why three different ways in</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        The printed template gives the best result, because the baseline is printed rather than inferred. But
        the first person to test this tool did not own a printer — so there is also a plain-paper route that
        works out the baseline from your own letters, and a browser route for anyone with a stylus. Different
        constraints, same font at the end.
      </p>

      <h2 className="mt-10 text-xl font-bold">What it will not do</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        It will not reproduce joined-up cursive — a font sets each character independently and cannot know
        what came before it. It will not invent characters you did not write. And it will not turn careful,
        slow lettering into something that looks like you; write at your normal speed.
      </p>

      <h2 className="mt-10 text-xl font-bold">Contact</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        Bugs, odd results or a photo that will not read: <a className="font-semibold text-brand hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        A copy of the photo that failed helps enormously.
      </p>

      <p className="mt-10 text-sm text-gray-500">
        <Link href="/create/" className="font-semibold text-brand hover:underline">Make your font →</Link>
      </p>
      <RelatedLinks page="/about/" />
    </main>
  );
}
