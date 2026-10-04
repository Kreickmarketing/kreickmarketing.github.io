import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The interview drill lives in a Claude app; this keeps /clrcrm/interview working as a shortcut to it.
    return [{ source: "/clrcrm/interview", destination: "https://claude.ai/artifact/2UaLS69xqFrg1cWCPKjD1M", permanent: false }];
  },
};

export default nextConfig;
