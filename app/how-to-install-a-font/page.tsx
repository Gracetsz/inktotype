import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/RelatedLinks';
import { url, OG_IMAGE } from '@/lib/site';
import { JsonLd, Faq, faqPage, howTo, breadcrumb } from '@/components/Seo';

export const metadata: Metadata = {
  title: 'How to install a TTF font on any device',
  description: 'Install a .ttf font on Windows, macOS, iPhone, iPad, Android, Google Docs and Canva — plus what to do when the font does not show up in your app.',
  alternates: { canonical: url('/how-to-install-a-font/') },
  openGraph: {
    title: 'How to install a TTF font on any device',
    description: 'Windows, macOS, iPhone, iPad, Android, Google Docs, Canva — and how to fix a font that will not appear.',
    url: url('/how-to-install-a-font/'),
    images: [OG_IMAGE],
  },
};

const FAQ = [
  {
    q: 'How do I install a TTF font?',
    a: 'On Windows, right-click the .ttf file and choose Install. On macOS, double-click it and click Install Font. Both take a couple of seconds, and the font then appears in every app that lists your system fonts. The one step people miss is that apps only read the font list when they start, so anything already open needs restarting.',
  },
  {
    q: 'I installed the font but it is not showing up. Why?',
    a: 'Nine times out of ten the app was already open when you installed it. Quit it completely and reopen — on a Mac that means Quit, not just closing the window. If it still does not appear, check you are looking under the font\'s own name rather than the file name, and that the install actually completed rather than only previewing the font.',
  },
  {
    q: 'Can I install a font on an iPhone or iPad?',
    a: 'Yes, but not by tapping the file. iOS installs fonts through configuration profiles, so you need an app such as iFont or Fontcase to wrap the .ttf into a profile, which you then approve in Settings. Once installed the font is available in Pages, Keynote, Numbers and other apps that support custom fonts — though not in every app, and not in the system interface.',
  },
  {
    q: 'How do I use a custom font in Google Docs?',
    a: 'You cannot install one directly. Google Docs only offers fonts from Google\'s own library, and there is no upload. The practical routes are to use the font in a desktop app such as Word and export a PDF, or to use it in Canva, which does allow font uploads on its paid plans.',
  },
  {
    q: 'Can I install a font on Android?',
    a: 'It depends on the phone. Samsung devices can install fonts through Settings under Display, and some other manufacturers have similar options. Most stock Android builds cannot change the system font without root access, though individual apps that support custom fonts may still let you use it.',
  },
  {
    q: 'Do I need to keep the .ttf file after installing?',
    a: 'No. Both Windows and macOS copy the font into the system when you install it, so the original file can be moved or deleted. Keep a backup anyway — if you made the font yourself, that file is the only copy.',
  },
  {
    q: 'Can I use a font I made on a font I share with other people?',
    a: 'A font you made from your own handwriting is yours to use and to share. But remember that anyone you send the .ttf to has to install it too — if you send them a document instead, embed the font or export a PDF, otherwise their computer will substitute something else.',
  },
];

const Step = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <li className="flex gap-3">
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{n}</span>
    <span className="leading-relaxed text-gray-600">{children}</span>
  </li>
);

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={[
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Install a font', path: '/how-to-install-a-font/' }]),
        faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        howTo('Install a TTF font on Windows or macOS', [
          { name: 'Download the .ttf file', text: 'Save the font file somewhere you can find it, such as your Downloads folder.' },
          { name: 'Install it', text: 'On Windows right-click the file and choose Install. On macOS double-click it and click Install Font.' },
          { name: 'Restart your apps', text: 'Quit and reopen any app that was already running — apps read the font list at startup.' },
          { name: 'Find it by name', text: 'Look for the font under its own name in the font menu, not the name of the file.' },
        ]),
      ]} />

      <h1 className="text-4xl font-extrabold leading-tight tracking-tight">How to install a font</h1>
      <p className="mt-4 text-lg leading-relaxed text-gray-600">
        You have a .ttf file — maybe one you just{' '}
        <Link href="/create/" className="font-semibold text-brand hover:underline">made from your own handwriting</Link>{' '}
        — and now you need it in your apps. On a computer this takes about ten seconds. On a phone it is
        more involved, and in Google Docs it is not possible at all. Here is each case.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Windows</h2>
        <ol className="mt-4 space-y-3">
          <Step n="1">Find the .ttf file, usually in your Downloads folder.</Step>
          <Step n="2">Right-click it and choose <b>Install</b>. To make it available to everyone on the PC, choose <b>Install for all users</b> instead — that one needs administrator rights.</Step>
          <Step n="3">Quit and reopen any app that was already running.</Step>
        </ol>
        <p className="mt-4 leading-relaxed text-gray-600">
          You can also drag the file into <b>Settings → Personalisation → Fonts</b>, which is handy for
          installing several at once. Microsoft&apos;s own reference is{' '}
          <a className="font-semibold text-brand hover:underline" href="https://support.microsoft.com/en-us/windows/experience/personalization/manage-fonts-in-windows" target="_blank" rel="noopener noreferrer">Manage fonts in Windows</a>.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">macOS</h2>
        <ol className="mt-4 space-y-3">
          <Step n="1">Double-click the .ttf file. A preview window opens.</Step>
          <Step n="2">Click <b>Install Font</b>. This is the step people skip — the preview alone does not install anything.</Step>
          <Step n="3">Font Book opens and validates the font. Warnings about a missing licence or unusual metrics are normal for a home-made font and do not stop it working.</Step>
          <Step n="4">Quit and reopen any app that was already running. On a Mac, closing the window is not enough — use Quit.</Step>
        </ol>
        <p className="mt-4 leading-relaxed text-gray-600">
          Apple&apos;s{' '}
          <a className="font-semibold text-brand hover:underline" href="https://support.apple.com/guide/font-book/install-and-validate-fonts-fntbk1000/mac" target="_blank" rel="noopener noreferrer">Font Book guide</a>{' '}
          covers the other methods, including installing for all users.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">iPhone and iPad</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          iOS does not install fonts from files directly. Fonts arrive through <b>configuration profiles</b>,
          so you need a font-manager app — iFont and Fontcase are the usual choices — to wrap the .ttf into
          a profile. The app hands the profile to Settings, you approve it there, and the font becomes
          available.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          Two limits worth knowing before you start. Apps have to opt in to custom fonts, so the font shows
          up in Pages, Keynote and Numbers but not everywhere. And you cannot change the iOS system font
          this way — installed fonts are for use <i>inside</i> apps.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Android</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          This one depends on who made your phone. Samsung supports it directly — <b>Settings → Display →
          Font size and style → Font style</b> — though it may want the font packaged as an APK rather than
          a bare .ttf, which the Samsung font apps handle. Most stock Android builds have no way to add a
          system font without root access. Individual apps that support custom fonts are a separate matter
          and may still work.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Google Docs, Canva and other web apps</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          <b className="text-ink">Google Docs cannot use your font.</b> Its font menu is drawn from Google&apos;s
          own library and there is no upload, so a font installed on your computer will not appear there. If
          your document has to end up in Docs, the realistic options are to build the page in a desktop app
          and export a PDF, or to use an image of the text.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          <b className="text-ink">Canva does allow font uploads</b>, under Brand settings, on its paid plans.
          Once uploaded the font behaves like any other in your designs.
        </p>
        <p className="mt-3 leading-relaxed text-gray-600">
          <b className="text-ink">Desktop apps just work.</b> Word, Photoshop, Illustrator, Figma&apos;s desktop
          app, InDesign and Affinity all read your system fonts, so anything you install shows up — after a
          restart.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">The font is installed but does not appear</h2>
        <ul className="mt-4 space-y-3 text-gray-600">
          <li><b className="text-ink">The app was open during install.</b> By far the most common cause. Quit it completely and reopen.</li>
          <li><b className="text-ink">You are looking for the wrong name.</b> Fonts are listed by the name stored inside the file, which is not necessarily the file name. If you made the font here, it is whatever you typed in the name field before downloading.</li>
          <li><b className="text-ink">You previewed instead of installing.</b> On macOS, double-clicking only opens a preview — the Install Font button still has to be clicked.</li>
          <li><b className="text-ink">It went to the wrong account.</b> A font installed for one user is not visible to another. Reinstall for all users if you need it everywhere.</li>
          <li><b className="text-ink">A stale font cache.</b> Rare, but a restart of the machine clears it and is quicker than the alternatives.</li>
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-extrabold tracking-tight">Do not have a font to install yet?</h2>
        <p className="mt-2 leading-relaxed text-gray-600">
          You can make one from your own handwriting here in about ten minutes — free, no account, and
          nothing is uploaded.
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
      <RelatedLinks page="/how-to-install-a-font/" />
    </main>
  );
}
