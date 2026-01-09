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
    // Fix HMR issues
    optimizePackageImports: ['lucide-react'],
  },
  
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  // Set empty config to silence the warning (we're using webpack for HMR stability)
  turbopack: {},
  
  // Suppress source map warnings
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  
  // Webpack configuration to fix HMR issues
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Fix HMR for React - ensure proper module resolution
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
      // Ensure proper cache handling - use memory cache for dev server
      config.cache = {
        type: 'memory',
      };
      // Fix for lucide-react HMR issues
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
        },
      };
      // Suppress source map warnings from node_modules
      config.ignoreWarnings = [
        {
          module: /node_modules/,
          message: /Invalid source map/,
        },
      ];
    }
    // Suppress source map warnings in production too
    if (!dev) {
      config.ignoreWarnings = [
        {
          module: /node_modules/,
          message: /Invalid source map/,
        },
      ];
    }
    return config;
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
