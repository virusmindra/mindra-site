'use client';

import {NextIntlClientProvider} from 'next-intl';

type Props = React.ComponentProps<typeof NextIntlClientProvider>;

export default function SafeIntlProvider(props: Props) {
  return (
    <NextIntlClientProvider
      {...props}
      onError={() => {}}                       // глушим MISSING_MESSAGE на клиенте
      getMessageFallback={({key}) => key}      // показываем ключ, если нет перевода
    />
  );
}
