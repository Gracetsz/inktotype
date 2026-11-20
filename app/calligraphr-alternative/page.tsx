import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import { url, OG_IMAGE } from '@/lib/site';
import { JsonLd, Faq, faqPage, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'A free Calligraphr alternative — 76 characters, no account',
  description: 'An honest comparison of InkToType and Calligraphr: what each gives you free, where Calligraphr is still the better tool, and when the free one is enough.',
  alternates: { canonical: url('/calligraphr-alternative/') },
  openGraph: {
    title: 'A free Calligraphr alternative',
    description: '76 characters free, no account, nothing uploaded — and an honest note on where Calligraphr still wins.',
    url: url('/calligraphr-alternative/'),
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'Is there a free alternative to Calligraphr?',
    a: 'Yes. InkToType makes a 76-character handwriting font — A–Z, a–z, 0–9 and 14 punctuation marks — free, with no account and no watermark. Calligraphr\'s free plan covers 75 characters per font; its Pro plan raises that to 600 and costs $10 for one month, or $6 a month on a six-month upgrade.',
  },
  {
    q: 'What does Calligraphr do that InkToType does not?',
    a: 'Several things, and they are real. Calligraphr Pro supports up to 15 variants of each character so the same letter does not repeat identically, ligatures for letter pairs that should join, per-character spacing adjustment, up to 600 characters — which is what you need for accented and non-Latin alphabets — and server-side backup of your work. InkToType has none of these. If you want joined cursive or a language beyond basic Latin, Calligraphr is the better tool and it is not close.',
  },
  {
    q: 'What does InkToType do that Calligraphr does not?',
    a: 'Three things. It needs no account — you never register or give an email address. It runs entirely in your browser, so your handwriting is never uploaded anywhere. And it offers three ways in rather than one: a printed template, a photo of plain paper with no printer at all, or drawing directly on screen with a stylus.',
  },
  {
    q: 'Which one should I use?',
    a: 'If you want one font of your own everyday handwriting for personal use, start with the free tool — 76 characters covers everything you normally type in English, and you will know in ten minutes whether you like the result. If you need variants, ligatures, accents or a non-Latin script, pay for Calligraphr Pro. They are not really competing for the same job.',
  },
  {
    q: 'Do I need a printer for either of them?',
    a: 'Not for InkToType. The printed template gives the most precise letter positions, but you can also photograph handwriting on plain paper, or write with a stylus and never touch paper at all.',
  },
  {
    q: 'Are the fonts the same format?',
    a: 'Both produce standard installable fonts. InkToType gives you a TrueType .ttf, which installs on Windows and macOS and works in Word, Canva, Photoshop and anything else that reads your system fonts.',
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={[
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Calligraphr alternative', path: '/calligraphr-alternative/' }]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
      ]} />

      <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
        A free Calligraphr alternative
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-gray-600">
        Calligraphr is the best-known way to turn handwriting into a font, and it is a good tool. This page
        is not an attempt to tell you otherwise. It is a straight comparison, including the parts where
        Calligraphr is clearly better, so you can pick the one that fits what you are actually trying to do.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Side by side</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-3 pr-4 font-semibold"></th>
                <th className="py-3 pr-4 font-semibold text-ink">InkToType</th>
                <th className="py-3 font-semibold">Calligraphr</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-ink">Characters, free</td>
                <td className="py-3 pr-4">76</td>
                <td className="py-3">75 (600 on Pro)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-ink">Price</td>
                <td className="py-3 pr-4">Free</td>
                <td className="py-3">Free tier; Pro $10/month, or $6/month for six months</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-ink">Account required</td>
                <td className="py-3 pr-4">No</td>
                <td className="py-3">Yes</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-ink">Ways to capture writing</td>
                <td className="py-3 pr-4">Printed template, photo of plain paper, or stylus on screen</td>
                <td className="py-3">Printed template</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-ink">Character variants</td>
                <td className="py-3 pr-4">No</td>
                <td className="py-3">2 free, up to 15 on Pro</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-ink">Ligatures</td>
                <td className="py-3 pr-4">No</td>
                <td className="py-3">Pro only</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-ink">Per-character spacing</td>
                <td className="py-3 pr-4">No</td>
                <td className="py-3">Pro only</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-ink">Fonts at once</td>
                <td className="py-3 pr-4">Unlimited</td>
                <td className="py-3">1 free, 20 on Pro</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Calligraphr figures are from its published pricing page and were checked in August 2026. Pricing
          changes — check theirs before deciding on the strength of a number in a table on someone
          else&apos;s website.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Where Calligraphr is the better tool</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          Three cases, and in all of them you should pay them rather than use this.
        </p>
        <ul className="mt-4 space-y-3 text-gray-600">
          <li><b className="text-ink">You want joined-up cursive.</b> Real cursive needs ligatures — shapes that connect one letter to the next. Without them, joined handwriting comes out as a row of disconnected letters that were drawn as if they would connect. Calligraphr Pro does ligatures; this does not.</li>
          <li><b className="text-ink">You want it to stop looking repetitive.</b> One fixed shape per character means every <i>e</i> in a paragraph is pixel-identical, which real handwriting never is. Calligraphr&apos;s multiple variants per character are the fix, and they matter more the more text you set.</li>
          <li><b className="text-ink">You need accents or a non-Latin script.</b> 76 characters covers English. Anything with accented vowels, Cyrillic, Greek or a larger character set needs the 600-character limit.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Where the free one is enough</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          The common case, honestly. Most people making a handwriting font want one font, of their own
          normal print handwriting, in English, to use on cards, notes, a personal project or a bit of
          design work. For that, 76 characters is not a stripped-down free tier — it is the whole job, and
          the ceiling never comes up.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          Two other things tend to decide it. There is no account here, so you can go from curious to
          finished font without registering or handing over an email address. And nothing is uploaded: the
          photo is decoded, cut up, traced and assembled into a TTF by JavaScript on your own machine, so
          your handwriting never leaves your device. Whether that second point matters is up to you —
          handwriting is more personal than most of what people upload without thinking.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          There is also no printer requirement.{' '}
          <Link href="/font-from-image/" className="font-semibold text-brand hover:underline">Photograph plain paper</Link>{' '}
          or{' '}
          <Link href="/draw/" className="font-semibold text-brand hover:underline">draw with a stylus</Link>{' '}
          and you never print anything.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-extrabold tracking-tight">Try it — it takes about ten minutes</h2>
        <p className="mt-2 leading-relaxed text-gray-600">
          Nothing to sign up for, so the cost of finding out whether the result is good enough for you is
          ten minutes and a sheet of paper.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/create/" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
            Make my font — free
          </Link>
          <Link href="/handwriting-to-font/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
            How handwriting becomes a font
          </Link>
        </div>
      </section>

      <Faq items={FAQ.map((f) => ({ q: f.q, a: f.a }))} />
      <RelatedLinks page="/calligraphr-alternative/" />
    </main>
  );
}
