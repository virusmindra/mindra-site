/// src/app/[locale]/(chat)/layout.tsx
import type { ReactNode } from 'react';

export default function ChatLayout({ children }: { children: ReactNode }) {
  // только чат “фиксированный”
  return (
    <div className="h-[100dvh] overflow-hidden">
      {children}
    </div>
  );
}
