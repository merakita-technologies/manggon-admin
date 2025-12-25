import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Temporarily disabled React Compiler due to compatibility issues with React 19
  // reactCompiler: true,
  
  // Disable source maps in development to reduce warnings
  productionBrowserSourceMaps: false,
  
  // Optimize build to reduce memory usage
  // Reduce number of workers to prevent memory issues
  experimental: {
    // Use single worker to reduce memory usage
    webpackBuildWorker: false,
  },
  
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  // Empty config to silence warnings
  turbopack: {},
  
  // Suppress source map warnings
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  
  // PWA Configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
