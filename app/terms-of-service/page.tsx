import type { Metadata } from 'next';
import { SITE_NAME, CONTACT_EMAIL, url } from '@/lib/site';
import { JsonLd, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The terms for using InkToType: the font you make is entirely yours, the tool is provided as is, and copying someone else’s published typeface is not allowed.',
  alternates: { canonical: url('/terms-of-service/') },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <JsonLd data={breadcrumb([{ name: 'Home', path: '/' }, { name: 'Terms of service', path: '/terms-of-service/' }])} />
      <h1 className="text-3xl font-extrabold tracking-tight">Terms of service</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: 31 July 2026</p>

      <p className="mt-6 leading-relaxed text-gray-600">
        By using {SITE_NAME} you agree to what follows. It is short because the tool does very little on our
        side — it runs in your browser and we never receive your files.
      </p>

      <h2 className="mt-10 text-xl font-bold">The font you make is yours</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        A font built from your own handwriting belongs to you. We claim no ownership of it and no licence over
        it. You may use it personally or commercially, sell products made with it, and give it to whomever you
        like. We could not restrict it in any case: the file is generated on your machine and never sent to us.
      </p>

      <h2 className="mt-10 text-xl font-bold">What you must not do</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        Do not use this tool to reproduce a typeface that is not yours. Specifically, do not photograph or scan
        a printed specimen, a type foundry&apos;s sample sheet, or a screenshot of an existing commercial font,
        and run it through here to obtain a copy. Typefaces are protected by copyright in many jurisdictions
        and by licence agreements almost everywhere, and a hand-traced or photographed reproduction is still a
        reproduction.
      </p>
      <p className="mt-3 leading-relaxed text-gray-600">
        Also do not use it to forge another person&apos;s handwriting or signature for the purpose of deceiving
        anyone. Building a font from a family member&apos;s handwriting with their knowledge is fine and is one
        of the nicer things this tool is used for; impersonation is not.
      </p>

      <h2 className="mt-10 text-xl font-bold">No warranty</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        The tool is provided as is, without warranty of any kind. Handwriting varies, cameras vary and paper
        varies; some sheets will not read cleanly, and some characters will need redrawing. We do not
        guarantee that the tool will produce a usable font from any particular photo, nor that a font it
        produces will behave identically in every application.
      </p>
      <p className="mt-3 leading-relaxed text-gray-600">
        Because your files never reach us, we cannot recover anything you lose. Keep your own copy of the
        photo and the downloaded font.
      </p>

      <h2 className="mt-10 text-xl font-bold">Limitation of liability</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        To the fullest extent permitted by law, {SITE_NAME} is not liable for any indirect or consequential
        loss arising from use of the tool or of a font produced with it.
      </p>

      <h2 className="mt-10 text-xl font-bold">Changes and contact</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        These terms may change; the date above will change with them. Questions:{' '}
        <a className="font-semibold text-brand hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </main>
  );
}
