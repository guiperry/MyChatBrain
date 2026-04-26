/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set the output directory for the build
  distDir: '.next',
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Configure the page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Skip TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack configuration to handle Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Exclude backup directory from build
    config.module.rules.push({
      test: /backups\/.*\.tsx?$/,
      use: 'ignore-loader'
    });

    // Handle NebulaDB module resolution - use empty modules for missing dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      '@nebula-db/adapter-memory': false,
      '@nebula-db/adapter-localstorage': false,
      '@nebula-db/adapter-indexeddb': false,
      '@nebula-db/adapter-filesystem': false,
      '@nebula-db/adapter-sqlite': false,
      '@nebula-db/plugin-validation': false,
    };
    
    return config;
  }
};

module.exports = nextConfig;