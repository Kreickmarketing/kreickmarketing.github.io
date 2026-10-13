import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Studio builder and new CRM routes read their HTML source at run time; ship those files with them.
  outputFileTracingIncludes: {
    "/clrcrm/studio/builder": ["./docs/prototypes/studio-builder/studio-builder.html"],
    "/clrcrm/crm": ["./docs/prototypes/crm/crm.html"],
  },
};

export default nextConfig;
