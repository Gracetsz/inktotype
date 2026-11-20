import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { IS_TEMP_DOMAIN, SITE_NAME, SITE_TAGLINE, SITE_URL, CONTACT_EMAIL } from '@/lib/site';
import ConsentBoot from '@/components/ConsentBoot';
import CookieBanner from '@/components/CookieBanner';
import { LogoLockup, LogoMark } from '@/components/Logo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: 'Print a template, write your letters, snap a photo. Get an installable TTF of your own handwriting — free, and it never leaves your browser.',
  robots: IS_TEMP_DOMAIN ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: { type: 'website', siteName: SITE_NAME, url: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ConsentBoot />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <nav className="no-print sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/85 px-6 backdrop-blur">
          <Link href="/" aria-label={`${SITE_NAME} home`}>
            <LogoLockup />
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/font-from-image/" className="hover:text-brand">From a photo</Link>
            <Link href="/draw/" className="hover:text-brand">Draw online</Link>
            <Link href="/font-template/" className="hover:text-brand">Font template</Link>
            <Link
              href="/create/"
              className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
            >
              Make my font
            </Link>
          </div>
        </nav>
        {children}
        <CookieBanner />
        <footer className="no-print border-t border-gray-200 px-6 py-10 text-sm text-gray-500">
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              <p className="flex items-center gap-2 font-semibold text-ink">
                <LogoMark size={20} className="shrink-0" />
                {SITE_NAME}
              </p>
              <p className="mt-1.5 max-w-sm leading-relaxed">
                Everything runs in your browser. Your photo and your handwriting are never uploaded to a server.
              </p>
              <p className="mt-2">
                <a className="hover:text-brand" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
            </div>
            <nav className="flex flex-col gap-1.5">
              <p className="font-semibold text-ink">Make a font</p>
              <Link href="/create/" className="hover:text-brand">Printed template</Link>
              <Link href="/font-from-image/" className="hover:text-brand">From a photo</Link>
              <Link href="/draw/" className="hover:text-brand">In the browser</Link>
              <Link href="/font-template/" className="hover:text-brand">Free font template</Link>
              <Link href="/font-template-pdf/" className="hover:text-brand">Font template PDF</Link>
            </nav>
            <nav className="flex flex-col gap-1.5">
              <p className="font-semibold text-ink">More</p>
              <Link href="/handwriting-font-generator/" className="hover:text-brand">Handwriting font generator</Link>
              <Link href="/handwriting-to-font/" className="hover:text-brand">Handwriting to font</Link>
              <Link href="/make-your-own-font/" className="hover:text-brand">How it works</Link>
              <Link href="/how-to-install-a-font/" className="hover:text-brand">Install a font</Link>
              <Link href="/calligraphr-alternative/" className="hover:text-brand">Calligraphr alternative</Link>
              <Link href="/about/" className="hover:text-brand">About</Link>
              <Link href="/privacy-policy/" rel="nofollow" className="hover:text-brand">Privacy policy</Link>
              <Link href="/terms-of-service/" rel="nofollow" className="hover:text-brand">Terms of service</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
