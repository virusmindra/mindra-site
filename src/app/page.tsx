// src/app/page.tsx
import {redirect} from 'next/navigation';
import {defaultLocale} from '@/i18n';

export default function Home() {
  redirect(`/${defaultLocale}`);
}
