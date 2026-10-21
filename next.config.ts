import type { NextConfig } from "next";

// While the move from /clrcrm to /apps settles (Oct 2026) the redirects are temporary (307),
// so a rollback is safe. After a week with no problems, set this to true (308, permanent).
const permanent = false;

const nextConfig: NextConfig = {
  // The team apps moved from /clrcrm to /apps on Oct 21, 2026. Old addresses (bookmarks,
  // reset emails, copied CRM links) are forwarded with their path and query kept.
  // The old CRM's lead pages were retired on Oct 14, 2026; their addresses go to the new CRM.
  async redirects() {
    const retired = ["pipeline", "database", "funnel", "clients", "clients/:path*"];
    return [
      ...retired.map((p) => ({ source: `/clrcrm/crm/${p}`, destination: "/apps/crm", permanent })),
      { source: "/clrcrm", destination: "/apps/playbook", permanent },
      { source: "/clrcrm/:path+", destination: "/apps/:path+", permanent },
    ];
  },
  // The Studio builder and new CRM routes read their HTML source at run time; ship those files with them.
  outputFileTracingIncludes: {
    "/apps/studio/builder": ["./docs/prototypes/studio-builder/studio-builder.html", "./styles/*.css"],
    "/apps/crm": ["./docs/prototypes/crm/crm.html"],
  },
};

export default nextConfig;
