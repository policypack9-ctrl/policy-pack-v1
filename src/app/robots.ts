import type { MetadataRoute } from "next";

import { PRODUCTION_APP_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${PRODUCTION_APP_URL}/sitemap.xml`,
    host: PRODUCTION_APP_URL,
  };
}
