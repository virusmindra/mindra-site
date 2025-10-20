'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export default function AppHeader() {
  const params = useParams() as { locale?: string };
  const locale = params?.locale ?? 'en';
  const pathname = usePathname();

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active = pathname?.startsWith(href);
    return (
      <Link
        href={href}
        className={`px-3 py-1.5 rounded-xl text-sm transition
          ${active ? 'bg-white text-zinc-900' : 'border border-white/15 hover:bg-white/10'}
        `}
      >
        {children}
      </Link>
    );
  };

  return (
    <header className="border-b border-white/10 sticky top-0 z-30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-semibold tracking-wide">Mindra</Link>

        <nav className="flex items-center gap-2">
          <NavLink href={`/${locale}`}>Home</NavLink>
          <NavLink href={`/${locale}/pricing`}>Pricing</NavLink>
          <NavLink href={`/${locale}/chat`}>Chat</NavLink>
          <a
            className="px-3 py-1.5 rounded-xl text-sm border border-white/15 hover:bg-white/10"
            href="https://buy.stripe.com" target="_blank" rel="noopener"
          >
            Donate
          </a>
        </nav>
      </div>
    </header>
  );
}
