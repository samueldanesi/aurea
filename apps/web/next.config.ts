import type { NextConfig } from "next";

// Static export for GitHub Pages (project site at /aurea). USE_MOCKS mode
// needs no server at all -- everything the app fetches is intercepted
// client-side by src/mocks/setup.ts -- so a pure static build is enough.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/aurea",
  assetPrefix: "/aurea/",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
