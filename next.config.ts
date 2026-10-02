import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Delingsbillederne (/og/<slug>) læser skrifttypen og produktfotos fra disken.
  // På Vercel skal de filer eksplicit med i serverfunktionen.
  outputFileTracingIncludes: {
    "/og/*": ["./assets/**/*", "./public/images/products/**/*"],
  },
};

export default nextConfig;
