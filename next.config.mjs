import createNextIntlPlugin from 'next-intl/plugin';

// указываем, где лежит функция getRequestConfig (наш i18n)
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default withNextIntl(nextConfig);
