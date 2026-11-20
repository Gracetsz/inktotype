import { SITE_NAME, SITE_URL, url } from '@/lib/site';

/** JSON-LD 注入。静态导出下直接内联 script，无需客户端 JS。 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const softwareApp = (name: string, desc: string, path: string) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name,
  description: desc,
  url: url(path),
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Any (runs in a web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
});

export const faqPage = (qa: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: qa.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

export const howTo = (name: string, steps: { name: string; text: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name,
  totalTime: 'PT10M',
  estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
  step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
});

export const breadcrumb = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.name, item: url(it.path),
  })),
});

/** FAQ 区块。AEO 规范：首句直答，不铺垫。 */
export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-extrabold tracking-tight">Questions people actually ask</h2>
      <dl className="mt-6 space-y-6">
        {items.map(({ q, a }) => (
          <div key={q} className="border-t border-gray-200 pt-5">
            <dt className="font-bold text-ink">{q}</dt>
            <dd className="mt-1.5 leading-relaxed text-gray-600">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
