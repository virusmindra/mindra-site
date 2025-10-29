// src/app/page.tsx
import {redirect} from 'next/navigation';
import intlConfig from '../../next-intl.config';

export default function Home() {
  redirect(`/${intlConfig.defaultLocale}`);
}
