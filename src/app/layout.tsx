import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: "Mindra",
  description: "Your AI companion",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Явно добавляем favicon для Google */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className="min-h-dvh antialiased bg-[var(--bg)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
