"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart";
import { useWishlist } from "./wishlist";

const NAV = [
  { href: "/tjenester", label: "Tjenester", emoji: "🎁" },
  { href: "/oplevelser", label: "Oplevelser", emoji: "🎡" },
  { href: "/om-venskaber", label: "Om venskaber", emoji: "🤝" },
  { href: "/priser", label: "Sådan betaler du", emoji: "💸" },
  { href: "/om-villads", label: "Om Villads", emoji: "🙋‍♂️" },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const wishlist = useWishlist();
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (ready && count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 600);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count, ready]);

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-sun/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="group flex items-center gap-2" aria-label="Venskabsbutikken – forside">
          <span className="text-3xl transition-transform group-hover:animate-wiggle" aria-hidden="true">
            🌞
          </span>
          <span className="font-display text-xl font-bold leading-none sm:text-2xl">
            Venskabs<span className="text-coral">butikken</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Hovedmenu">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3 py-1.5 font-display font-semibold transition hover:bg-white/70 ${
                  active ? "bg-white shadow-[inset_0_0_0_2px_#2b2d42]" : ""
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/oenskeliste"
          className="btn btn-white ml-auto !px-3 !py-1.5 lg:ml-2"
          aria-label={`Ønskeliste, ${wishlist.slugs.length} ønsker`}
        >
          <span aria-hidden="true">{wishlist.ready && wishlist.slugs.length > 0 ? "💖" : "🤍"}</span>
          {wishlist.ready && wishlist.slugs.length > 0 && (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-pink px-1.5 text-sm">
              {wishlist.slugs.length}
            </span>
          )}
        </Link>

        <Link
          href="/kurv"
          className={`btn btn-white !px-3.5 !py-1.5 ${bump ? "animate-wiggle" : ""}`}
          aria-label={`Kurv, ${count} venskabsfragmenter`}
        >
          <span aria-hidden="true">🧺</span>
          <span className="hidden sm:inline">Kurv</span>
          {ready && count > 0 && (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-coral px-1.5 text-sm text-white">
              {count}
            </span>
          )}
        </Link>

        <button
          type="button"
          className="btn btn-white !px-3 !py-1.5 lg:hidden"
          aria-expanded={open}
          aria-controls="mobilmenu"
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true">{open ? "✖️" : "🍔"}</span>
          <span className="sr-only">Menu</span>
        </button>
      </div>

      {open && (
        <nav id="mobilmenu" className="border-t-[3px] border-ink bg-cream px-4 py-3 lg:hidden" aria-label="Mobilmenu">
          <ul className="grid gap-2">
            {NAV.map((n, i) => (
              <li key={n.href} className="animate-pop-in" style={{ animationDelay: `${i * 50}ms` }}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="card flex items-center gap-3 px-4 py-3 font-display text-lg"
                >
                  <span aria-hidden="true">{n.emoji}</span>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
