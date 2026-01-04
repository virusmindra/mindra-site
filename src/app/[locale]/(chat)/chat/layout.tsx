// src/app/[locale]/(chat)/layout.tsx
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-[100dvh] overflow-hidden bg-[var(--bg)]">{children}</div>;
}
