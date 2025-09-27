import {getT} from '@/lib/getT';

export default async function HomePage({params:{locale}}:{
  params: {locale: string}
}) {
  const t = await getT({locale}); // можно без namespace, тогда ключи полные: 'home.title'
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
    </div>
  );
}
