import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: '/poker-squid-lab',
  assetPrefix: '/poker-squid-lab/',
  trailingSlash: true,
};
export default config;
