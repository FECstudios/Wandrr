/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SHOV_PROJECT: process.env.SHOV_PROJECT,
    SHOV_API_KEY: process.env.SHOV_API_KEY,
    HF_TOKEN: process.env.HF_TOKEN,
    JWT_SECRET: process.env.JWT_SECRET,
  },
}

module.exports = nextConfig