// src/app/[locale]/donate/page.tsx
import {redirect} from 'next/navigation';
import {DONATE_URL} from '@/lib/links';

// чтобы не закешировалось статикой и редирект всегда срабатывал
export const dynamic = 'force-dynamic';

export default function DonateRedirect() {
  redirect(DONATE_URL);
}