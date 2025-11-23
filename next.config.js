/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_SSL: process.env.DB_SSL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
}

module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Set according to your needs
    },
  },
  // ...other config
};

module.exports = nextConfig