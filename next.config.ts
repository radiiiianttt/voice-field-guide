import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the little Next.js dev-tools badge ("N") in the corner.
  // It only ever shows in development anyway — never in production.
  devIndicators: false,
};

export default nextConfig;
