// src/app/[locale]/layout.tsx
import '../globals.css';
import {ReactNode} from 'react';

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        {children}
      </body>
    </html>
  );
}
