import {redirect} from 'next/navigation';
import {defaultLocale} from '../../next-intl.config'; // или '@/../next-intl.config'

export default function Home() {
  redirect(`/${defaultLocale}`);
}
