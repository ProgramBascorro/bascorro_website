import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const r2Host = (() => {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (baseUrl) {
    try {
      return new URL(baseUrl).hostname;
    } catch {
      return 'c05a8925bbeb8c9d3b2b9b01008490b7.r2.cloudflarestorage.com';
    }
  }
  return 'c05a8925bbeb8c9d3b2b9b01008490b7.r2.cloudflarestorage.com';
})();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: r2Host },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.google.com' },
      { protocol: 'https', hostname: 't3.gstatic.com' },
    ],
  },
};

export default withMDX(config);
