import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Props = { locale: string };

export default function Header({locale}: Props) {
  return (
    <header className="flex items-center justify-between py-4 border-b border-white/10">
      <Link href={`/${locale}`} className="font-semibold">Mindra</Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href={`/${locale}/pricing`} className="opacity-80 hover:opacity-100">Pricing</Link>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
