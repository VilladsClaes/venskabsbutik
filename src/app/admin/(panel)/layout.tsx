import Link from "next/link";
import { logout } from "../actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Overblik", e: "📊" },
  { href: "/admin/ordrer", label: "Ordrer", e: "🧾" },
  { href: "/admin/produkter", label: "Produkter", e: "🎁" },
  { href: "/admin/leverancer", label: "Leveringsdagbog", e: "📔" },
  { href: "/admin/kunder", label: "Kunder", e: "🤝" },
  { href: "/admin/anmeldelser", label: "Anmeldelser", e: "💬" },
  { href: "/admin/indstillinger", label: "Indstillinger", e: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-[#f4f1ea] lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="border-b-[3px] border-ink bg-sun lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r-[3px]">
        <div className="flex items-center justify-between gap-2 p-4 lg:block">
          <Link href="/admin" className="font-display text-xl font-bold">
            🌞 Baglokalet
          </Link>
          <Link href="/" className="text-sm font-semibold underline lg:mt-1 lg:block" target="_blank">
            Se butikken ↗
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible" aria-label="Admin">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-xl px-3 py-2 font-display font-semibold hover:bg-white/70"
            >
              <span aria-hidden="true">{n.e}</span> {n.label}
            </Link>
          ))}
          <form action={logout} className="lg:mt-4">
            <button className="whitespace-nowrap rounded-xl px-3 py-2 font-display font-semibold text-ink-soft hover:bg-white/70">
              🚪 Log ud
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
