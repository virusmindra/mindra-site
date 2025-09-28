// next.config.mjs
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Мапим импорт 'next-intl/config' на твой локальный next-intl.config.ts
    config.resolve.alias['next-intl/config'] = path.resolve(
      process.cwd(),
      './next-intl.config.ts'
    );
    return config;
  }
};

export default nextConfig;
