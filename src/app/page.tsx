// src/app/page.tsx
import { redirect } from 'next/navigation';
import { defaultLocale } from '@/locales'; // <-- было '@/i18n'

export default function Home() {
  redirect(`/${defaultLocale}`);
}
