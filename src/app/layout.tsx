import './globals.css';
import Providers from './providers';
import AuthButton from '@/components/AuthButton';

export const metadata = {
  title: 'Mindra',
  description: 'Mindra web chat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* ВАЖНО: оборачиваем и header, и children в Providers, чтобы useSession работал */}
        <Providers>
          <header className="flex items-center justify-end px-6 py-3">
            <AuthButton />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
