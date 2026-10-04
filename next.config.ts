import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The CRM lives in a Claude app; this keeps /clrcrm/crm working as a shortcut to it.
    return [{ source: "/clrcrm/crm", destination: "https://claude.ai/artifact/1sFGYEMrhg7cAioUdKRNvK", permanent: false }];
  },
};

export default nextConfig;
