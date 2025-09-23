import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mindra — тёплый AI-друг и коуч",
  description: "Поддержка, мотивация, цели и привычки в одном боте. Работает на 11 языках. @talktomindra_bot",
  metadataBase: new URL("https://example.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
