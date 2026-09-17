import type { NextConfig } from "next";
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  basePath: "/kitchen",
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
