export default function sitemap() {
  const base = 'https://mindra-site.vercel.app';
  const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'];
  const routes = ['', '/pricing'];
  return locales.flatMap(l =>
    routes.map(r => ({
      url: `${base}/${l}${r}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: r === '' ? 1.0 : 0.8
    }))
  );
}
