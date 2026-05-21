/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'abahcode.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'is3.cloudhost.id' },
      { protocol: 'https', hostname: 'sin1.contabostorage.com' },
    ],
  },
  // CSP + security headers live in middleware (src/middleware.js) so they
  // can include a per-request nonce. Keeping them only there avoids a
  // weaker static CSP overriding the nonce-based one.
};

export default nextConfig;
