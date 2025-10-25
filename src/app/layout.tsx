// src/app/layout.tsx
import "./globals.css";
import Providers from "./providers"; // SessionProvider обёртка

export const metadata = {
  title: "Mindra",
  description: "Mindra web chat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased bg-zinc-950 text-zinc-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
