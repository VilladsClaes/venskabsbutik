/** Butikkens offentlige adresse – bruges til delingslinks, delingsbilleder, sitemap og Google */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://venskab.villadsclaes.dk").replace(/\/$/, "");
export const SITE_HOST = new URL(SITE_URL).host;
