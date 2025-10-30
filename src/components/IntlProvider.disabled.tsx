'use client';

export default function IntlProvider({
  children
}: {
  locale: string;              // типы оставляем
  messages: unknown;
  children: React.ReactNode;
}) {
  // ВРЕМЕННО: никакого NextIntlClientProvider
  return <>{children}</>;
}
