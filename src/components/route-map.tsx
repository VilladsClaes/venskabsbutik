"use client";

import type { GeoJsonObject } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { MapView, type MapRoute } from "./map-view";

type RouteInfo = { slug: string; name: string; caption: string; color: string; lines: number };

export function RouteMap({ routes }: { routes: RouteInfo[] }) {
  const [data, setData] = useState<Record<string, GeoJsonObject>>({});
  const [active, setActive] = useState<Set<string>>(() => new Set(routes.map((r) => r.slug)));

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      routes.map(async (r) => [r.slug, (await (await fetch(`/routes/${r.slug}.json`)).json()) as GeoJsonObject] as const),
    ).then((entries) => !cancelled && setData(Object.fromEntries(entries)));
    return () => {
      cancelled = true;
    };
  }, [routes]);

  const shown = useMemo<MapRoute[]>(
    () =>
      routes
        .filter((r) => active.has(r.slug) && data[r.slug])
        .map((r) => ({ id: r.slug, name: `${r.name} – ${r.caption}`, color: r.color, geojson: data[r.slug] })),
    [routes, active, data],
  );

  const toggle = (slug: string) =>
    setActive((a) => {
      const n = new Set(a);
      if (n.has(slug)) n.delete(slug);
      else n.add(slug);
      return n;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Vælg ruter">
        {routes.map((r) => (
          <button
            key={r.slug}
            type="button"
            aria-pressed={active.has(r.slug)}
            onClick={() => toggle(r.slug)}
            className={`inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold transition ${
              active.has(r.slug) ? "bg-white" : "bg-white/40 opacity-60"
            }`}
          >
            <span className="h-3 w-6 rounded-full" style={{ background: r.color }} aria-hidden="true" />
            {r.name}
          </button>
        ))}
      </div>
      <MapView routes={shown} center={[47, 2]} zoom={4} className="h-[560px]" />
      {Object.keys(data).length < routes.length && <p className="text-center font-semibold">Tegner ruterne … 🚲</p>}
    </div>
  );
}
