"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "venskabsbutik-oenskeliste-v1";

type WishlistValue = {
  slugs: string[];
  ready: boolean;
  has: (slug: string) => boolean;
  toggle: (slug: string) => boolean;
  remove: (slug: string) => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

/** Butikkens egen ønskeliste – gemmes i browseren og kan deles som et link */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- indlæs gemt liste efter hydrering
      if (raw) setSlugs(JSON.parse(raw));
    } catch {
      /* tom eller blokeret lagring */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
      /* ignorer */
    }
  }, [slugs, ready]);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const toggle = useCallback(
    (slug: string) => {
      const adding = !slugs.includes(slug);
      setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
      return adding;
    },
    [slugs],
  );
  const remove = useCallback((slug: string) => setSlugs((prev) => prev.filter((s) => s !== slug)), []);

  const value = useMemo(() => ({ slugs, ready, has, toggle, remove }), [slugs, ready, has, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist skal bruges inden i <WishlistProvider>");
  return ctx;
}
