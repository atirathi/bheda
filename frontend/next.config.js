/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    // In production (Traefik in front), these rewrites are bypassed because
    // the reverse proxy routes /api, /ws, /vuln directly. The rewrites below
    // are for `next dev` and `next start` against the docker-compose network.
    return [
      {
        // /api/v1/* → backend (which mounts routers at /api/v1/*)
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*',
      },
      {
        // /ws → ctf-engine on :3004. Backend WebSocket at /api/v1/ws is
        // also reachable through the api/v1 path; pick one consistently.
        source: '/ws/:path*',
        destination: 'http://ctf-engine:3004/:path*',
      },
      {
        // /vuln → vuln-app on :3001 (not :8000).
        source: '/vuln/:path*',
        destination: 'http://vuln-app:3001/:path*',
      },
    ];
  },
  // Lock down headers — Next.js doesn't ship with CSP by default.
  // The reverse proxy adds more, but defense in depth.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Strict CSP: only same-origin scripts/styles, no inline
          // (Next.js uses nonces but we omit them for now to keep
          // the build simple).  `'unsafe-inline'` is required for
          // Next.js's hydration inline scripts in dev; remove it in
          // production if nonces are added.
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self';" },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '/src',
    };
    return config;
  },
};

module.exports = nextConfig;
