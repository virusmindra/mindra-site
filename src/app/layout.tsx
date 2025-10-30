import './globals.css';
import {ReactNode} from 'react';

export default function GlobalLayout({children}:{children:ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">{children}</body>
    </html>
  );
}
