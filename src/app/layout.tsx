export const metadata = {
  title: 'Mindra',
  description: 'Support, motivation & habits tracker'
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  // Язык на уровне тега html ставим ru, локализованный layout внутри [locale] всё равно переопределит контент
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
