/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/vocab/random": ["./src/data/dictionary.json"],
  },
};
export default nextConfig;
