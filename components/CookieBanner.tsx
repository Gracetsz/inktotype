'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GA4_ID, CLARITY_ID, readConsent, writeConsent, applyConsent, loadClarity,
} from '@/lib/analytics';

/**
 * Cookie 同意横幅。
 *
 * 只有在「尚未选择」时才出现。选过之后存进 localStorage，不再打扰。
 *
 * 两个按钮权重刻意做成一样 —— 把"拒绝"做成一行灰色小字是深色模式设计，
 * GDPR 明确要求拒绝和接受一样容易。而且这个站的整个卖点就是隐私，
 * 在同意条上耍花招是自相矛盾。
 */
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!GA4_ID && !CLARITY_ID) return;
    if (readConsent() === null) setShow(true);
  }, []);

  if (!show) return null;

  const decide = (v: 'granted' | 'denied') => {
    writeConsent(v);
    applyConsent(v);
    if (v === 'granted') loadClarity();
    setShow(false);
  };

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-gray-600">
          We&apos;d like to use analytics cookies to see which parts of the site people actually use.{' '}
          <b className="text-ink">Your photo and your handwriting are never uploaded either way</b> — they
          are processed entirely on your device and analytics never sees them.{' '}
          <Link href="/privacy-policy/" className="font-semibold text-brand hover:underline">
            Privacy policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide('denied')}
            className="rounded-xl border-2 border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-300"
          >
            Decline
          </button>
          <button
            onClick={() => decide('granted')}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
