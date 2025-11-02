import {auth} from '@/server/auth';
import {getTSync} from '@/lib/getT';
import type {Locale} from '@/i18n';

export const revalidate = 0;

export default async function ThanksPage({params}: {params: {locale: Locale}}) {
  const {locale} = params;
  const t = getTSync(locale, 'thanks');

  const session = await auth();
  const name = session?.user?.name ?? t('friend', { /* если добавишь ключ */ });
  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-semibold">{t('thanks.title')}</h1>
      <p className="opacity-70">{t('thanks.text')}</p>
      <p className="mt-4 opacity-70">{t('thanks.back')}</p>
    </main>
  );
}
