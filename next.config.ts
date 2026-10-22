import type { NextConfig } from "next";
import { KREICK_HOSTS } from "./lib/studio-sites";

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
  // The Kreick Marketing site (Oct 22, 2026): on a Kreick address every page comes from app/kreick-site,
  // so none of ClearMark's pages show there (except the shared /_next, /fonts and /studio-media files).
  // On any other address that folder doesn't exist.
  async rewrites() {
    const kreick = [{ type: "host" as const, value: KREICK_HOSTS }];
    return {
      beforeFiles: [
        { source: "/kreick-site/:path*", missing: kreick, destination: "/not-found" },
        { source: "/", has: kreick, destination: "/kreick-site" },
        { source: "/:path((?!_next/|fonts/|studio-media/).+)", has: kreick, destination: "/kreick-site/:path" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // The test address stays out of search engines while kreickmarketing.com is still the Framer site.
  async headers() {
    return [{ source: "/:path*", has: [{ type: "host", value: "new\\.kreickmarketing\\.com" }], headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  // The Studio builder and new CRM routes read their HTML source at run time; ship those files with them.
  outputFileTracingIncludes: {
    "/apps/studio/builder": ["./docs/prototypes/studio-builder/studio-builder.html", "./styles/*.css"],
    "/apps/crm": ["./docs/prototypes/crm/crm.html"],
  },
};

export default nextConfig;
