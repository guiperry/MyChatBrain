/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set the output directory for the build
  distDir: '.next',
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Configure the page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Webpack configuration to handle Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  }
};

module.exports = nextConfig;