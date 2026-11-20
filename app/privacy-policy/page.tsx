import type { Metadata } from 'next';
import { SITE_NAME, CONTACT_EMAIL, url } from '@/lib/site';
import { JsonLd, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'InkToType processes your photo entirely inside your browser — it is never uploaded. Analytics cookies are optional and only set if you accept them.',
  alternates: { canonical: url('/privacy-policy/') },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <JsonLd data={breadcrumb([{ name: 'Home', path: '/' }, { name: 'Privacy policy', path: '/privacy-policy/' }])} />
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: 7 August 2026</p>

      <div className="mt-6 rounded-2xl border-2 border-brand bg-brand-light p-5">
        <p className="font-bold text-ink">The short version</p>
        <p className="mt-1.5 text-sm text-gray-700">
          Your photo and the font made from it never leave your device. They are not uploaded, not stored and
          not seen by us. Close the tab and they are gone.
        </p>
        <p className="mt-2 text-sm text-gray-700">
          Separately from that, we would like to count visits and see which parts of the site people use.
          That needs cookies, so we ask first — and analytics never sees your handwriting either way.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-bold">Your images and fonts</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        When you choose a photo, your browser reads the file directly from your device into memory. All
        processing — perspective correction, character cutting, outline tracing and font assembly — happens in
        JavaScript on your own machine. The resulting font is written to a temporary in-memory object and
        handed to your browser&apos;s download mechanism.
      </p>
      <p className="mt-3 leading-relaxed text-gray-600">
        At no point is the image or the font transmitted to {SITE_NAME} or to any third party. We could not
        produce a copy of your handwriting if asked, because we never receive one.
      </p>

      <h2 className="mt-10 text-xl font-bold">Accounts</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        There are none. We do not ask for your name, email address or any other identifying detail in order to
        use the tool.
      </p>

      <h2 className="mt-10 text-xl font-bold">Cookies and analytics</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        We use two analytics tools to understand how the site is used: <b>Google Analytics 4</b>, which counts
        visits and records which steps of the font-making flow people reach, and{' '}
        <b>Microsoft Clarity</b>, which produces heatmaps and session replays showing where people click and
        scroll. Both set cookies, so <b>nothing is loaded until you accept the banner</b>. Decline and Clarity
        is never loaded at all, while Google Analytics stays in a cookieless mode that can only count a visit.
      </p>
      <p className="mt-3 leading-relaxed text-gray-600">
        You can change your mind at any time by clearing this site&apos;s data in your browser, which removes
        the stored choice and brings the banner back.
      </p>

      <h3 className="mt-6 text-lg font-bold">What analytics can and cannot see</h3>
      <p className="mt-3 leading-relaxed text-gray-600">
        It can see which pages you opened, which step you stopped at, how many characters were recognised,
        and where you clicked. It is deliberately not told your font&apos;s name or your photo&apos;s filename,
        because people commonly put their own name in both.
      </p>
      <p className="mt-3 leading-relaxed text-gray-600">
        It cannot see your handwriting. Every drawing surface and preview on this site is an HTML canvas,
        which Clarity cannot capture, and each of those areas is additionally marked with Clarity&apos;s
        masking attribute — masked regions are stripped in your browser before anything is sent, not hidden
        afterwards. Text you type into any input box is masked by Clarity in every mode and cannot be
        unmasked. Session replays therefore show an empty frame where your letters are.
      </p>

      <h2 className="mt-10 text-xl font-bold">Third-party requests</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        Page styling loads the Inter typeface from Google Fonts, which means your browser makes a request to{' '}
        <span className="font-mono text-sm">fonts.googleapis.com</span> and{' '}
        <span className="font-mono text-sm">fonts.gstatic.com</span>. Google may log that request, as it does
        for any site using its font service; see{' '}
        <a className="font-semibold text-brand hover:underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s privacy policy</a>.
        No content of yours is included in those requests.
      </p>
      <p className="mt-3 leading-relaxed text-gray-600">
        If you accept analytics, your browser additionally contacts{' '}
        <span className="font-mono text-sm">googletagmanager.com</span> (Google Analytics) and{' '}
        <span className="font-mono text-sm">clarity.ms</span> (Microsoft Clarity). Both receive your IP
        address and browser details as part of any such request. See{' '}
        <a className="font-semibold text-brand hover:underline" href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">Microsoft&apos;s privacy statement</a>.
      </p>

      <h2 className="mt-10 text-xl font-bold">Children</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        The font tool itself collects nothing from anyone, of any age — a child&apos;s handwriting stays on
        their device exactly as an adult&apos;s does. If the analytics banner is declined, no cookies are set
        at all. It is safe for a child to use with the same supervision you would give any website.
      </p>

      <h2 className="mt-10 text-xl font-bold">Changes and contact</h2>
      <p className="mt-3 leading-relaxed text-gray-600">
        Any change to how data is handled will be reflected here with a new date at the top. Questions:{' '}
        <a className="font-semibold text-brand hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </main>
  );
}
