import {getT} from '@/lib/getT';

export default async function ThanksPage({params:{locale}}:{
  params: {locale: string}
}) {
  const t = await getT({locale, namespace: 'thanks'});

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p> {/* если перевода нет — выведется 'thanks.subtitle' */}
    </div>
  );
}