/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ensure the bundled dictionary ships with the /api/vocab/random function
    // (it's read at runtime via fs, so Next can't trace it automatically).
    outputFileTracingIncludes: {
      "/api/vocab/random": ["./src/data/dictionary.json"],
    },
  },
};
export default nextConfig;
