// src/app/layout.tsx
import './globals.css';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
