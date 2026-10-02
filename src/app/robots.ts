import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.villadsclaes.dk";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/kurv", "/ordre"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
