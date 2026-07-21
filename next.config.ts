import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB request body, far under the 25MB
      // PDF cap enforced in lib/documents/actions.ts - without raising this,
      // every real (non-trivial) PDF upload is rejected before it reaches
      // that validation, surfacing as a generic "Failed to fetch" client-side.
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;
