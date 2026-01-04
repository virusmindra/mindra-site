// src/components/SiteHeader.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function stripLocale(pathname: string) {
  // /ru/pricing -> /pricing
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  // если первая часть - локаль
  const maybeLocale = parts[0];
  if (["en", "ru", "uk"].includes(maybeLocale)) {
    const rest = parts.slice(1);
    return "/" + rest.join("/");
  }
  return pathname;
}

export default function SiteHeader({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const restPath = stripLocale(pathname || "/");

  const nav = [
    { href: `/${locale}`, label: "Home" },
    { href: `/${locale}/pricing`, label: "Pricing" },
    { href: `/${locale}/chat`, label: "Chat" },
    { href: `/${locale}/support`, label: "Donate" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-semibold text-[var(--text)]">
          Mindra
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {nav.map((i) => {
            const active = pathname === i.href || (i.href !== `/${locale}` && pathname?.startsWith(i.href));
            return (
              <Link
                key={i.href}
                href={i.href}
                className={[
                  "transition",
                  active
                    ? "text-[var(--text)] font-medium"
                    : "text-[var(--muted)] hover:text-[var(--text)]",
                ].join(" ")}
              >
                {i.label}
              </Link>
            );
          })}

          {/* Locale switch */}
          <div className="relative">
            <select
              value={locale}
              onChange={(e) => {
                const next = e.target.value;
                router.replace(`/${next}${restPath === "/" ? "" : restPath}`);
              }}
              className="ml-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none"
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="uk">Українська</option>
            </select>
          </div>
        </nav>
      </div>
    </header>
  );
}
