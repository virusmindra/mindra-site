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
      <body className="min-h-dvh antialiased bg-[var(--bg)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
