import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Studio builder route reads its HTML source at run time; ship that file with it.
  outputFileTracingIncludes: {
    "/clrcrm/studio/builder": ["./docs/prototypes/studio-builder/studio-builder.html"],
  },
};

export default nextConfig;
