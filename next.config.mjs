/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/vocab/random": ["./src/data/dictionary.json"],
  },
};
export default nextConfig;
