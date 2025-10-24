'use client';

import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Никакой логики — чистый провайдер, чтобы useSession работал везде под ним
  return <SessionProvider>{children}</SessionProvider>;
}
