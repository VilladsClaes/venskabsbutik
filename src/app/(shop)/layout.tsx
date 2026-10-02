import { CartProvider } from "@/components/cart";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { WishlistProvider } from "@/components/wishlist";
import { LiveTicker } from "@/components/live-ticker";
import { getRecentMentions } from "@/lib/experiences";
import { getSettings } from "@/lib/queries";

// Butikken viser live data (priser, antal solgte, anmeldelser) – render ved hver forespørgsel
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, mentions] = await Promise.all([getSettings(), getRecentMentions()]);
  return (
    <CartProvider>
      <WishlistProvider>
      <a href="#indhold" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">
        Gå til indhold
      </a>
      <Header />
      <main id="indhold">{children}</main>
      <LiveTicker mentions={mentions} />
      <Footer phone={settings.contactPhone ?? "60614309"} mobilepay={settings.mobilepayNumber ?? "60614309"} />
      </WishlistProvider>
    </CartProvider>
  );
}
