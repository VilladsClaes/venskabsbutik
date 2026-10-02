import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", weight: ["400", "500", "600", "700"] });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Venskabsbutikken – køb et venskab hos Villads Claes",
    template: "%s · Venskabsbutikken",
  },
  description:
    "Venskaber til salg! Køb små venskabsfragmenter hos Villads: digte, lussinger, bænke, godnathistorier og meget mere. Betal nemt med MobilePay.",
  openGraph: {
    locale: "da_DK",
    type: "website",
    siteName: "Venskabsbutikken",
    images: [{ url: "/og/forside", width: 1200, height: 630, alt: "Venskabsbutikken – venskaber til salg" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffd23f" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
