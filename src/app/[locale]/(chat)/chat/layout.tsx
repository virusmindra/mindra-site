import type { ReactNode } from 'react';

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {children}
    </div>
  );
}
