import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = SITE_URL;
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/kurv", "/ordre"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
