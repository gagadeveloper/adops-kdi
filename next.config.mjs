/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'out',
    images: {
      unoptimized: true
    },
    webpack: (config) => {
      config.resolve.alias['@'] = require('path').resolve(__dirname);
      return config;
    },
  };
  
  export default nextConfig;