import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' data: blob: https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.pinata.cloud https://api.pinata.cloud https://*.icp0.io http://localhost:4943 http://127.0.0.1:4943 http://localhost:9000 https://*.ngrok-free.app https://*.ngrok.io",
      "media-src 'self' https://firebasestorage.googleapis.com https://*.firebasestorage.googleapis.com blob:",
      "frame-ancestors 'none'",
    ].join('; ')
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=()'
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
