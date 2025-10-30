// src/components/IntlProvider.tsx
'use client';

export default function IntlProvider({
  children
}: {
  locale: string;
  messages: unknown;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
