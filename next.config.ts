import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Studio builder and new CRM routes read their HTML source at run time; ship those files with them.
  // The old CRM's lead pages were retired on Oct 14, 2026; their addresses go to the new CRM.
  async redirects() {
    return ["pipeline", "database", "funnel", "clients", "clients/:path*"].map((p) => ({ source: `/clrcrm/crm/${p}`, destination: "/clrcrm/crm", permanent: false }));
  },
  outputFileTracingIncludes: {
    "/clrcrm/studio/builder": ["./docs/prototypes/studio-builder/studio-builder.html"],
    "/clrcrm/crm": ["./docs/prototypes/crm/crm.html"],
  },
};

export default nextConfig;
