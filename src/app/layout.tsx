// src/app/layout.tsx
import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Mindra',
  description: 'Mindra web chat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
