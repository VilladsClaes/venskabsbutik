import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Delingsbillederne (/og/<slug>) læser skrifttypen og produktfotos fra disken.
  // På Vercel skal de filer eksplicit med i serverfunktionen.
  outputFileTracingIncludes: {
    "/og/*": ["./assets/**/*", "./public/images/products/**/*"],
  },
  experimental: {
    // Billeder formindskes i browseren før upload; Vercel tillader højst 4,5 MB pr. forespørgsel
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // Billeder uploadet fra admin ligger i Vercel Blob
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
