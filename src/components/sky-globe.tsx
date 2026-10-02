"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GlobeInstance } from "globe.gl";
import type { PublicDelivery } from "@/lib/experiences";

// Himlen deles op i felter på 10° × 10°. Et felt lyser gult, når nogen har købt himlen derover.
const STEP = 10;
const LAT_MIN = -60;
const LAT_MAX = 80;

type Tile = { id: string; lat0: number; lng0: number; sold: PublicDelivery[] };

function tileId(lat: number, lng: number) {
  const la = Math.max(LAT_MIN, Math.min(LAT_MAX - STEP, Math.floor(lat / STEP) * STEP));
  const ln = Math.floor(lng / STEP) * STEP;
  return `${la}:${ln}`;
}

function polygon(t: Tile) {
  const { lat0, lng0 } = t;
  const ring = [
    [lng0, lat0],
    [lng0 + STEP, lat0],
    [lng0 + STEP, lat0 + STEP],
    [lng0, lat0 + STEP],
    [lng0, lat0],
  ];
  return { type: "Feature", properties: t, geometry: { type: "Polygon", coordinates: [ring] } };
}

/** Breddegrader og længdegrader for himmellaget */
function skyGrid(): [number, number][][] {
  const lines: [number, number][][] = [];
  for (let la = LAT_MIN; la <= LAT_MAX; la += STEP) {
    const l: [number, number][] = [];
    for (let ln = -180; ln <= 180; ln += 5) l.push([la, ln]);
    lines.push(l);
  }
  for (let ln = -180; ln < 180; ln += STEP) {
    const l: [number, number][] = [];
    for (let la = LAT_MIN; la <= LAT_MAX; la += 5) l.push([la, ln]);
    lines.push(l);
  }
  return lines;
}

export function SkyGlobe({ deliveries, focusId }: { deliveries: PublicDelivery[]; focusId?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeInstance | null>(null);
  const [selected, setSelected] = useState<PublicDelivery | null>(null);
  const [ready, setReady] = useState(false);

  const placed = useMemo(() => deliveries.filter((d) => d.lat != null && d.lng != null), [deliveries]);
  const tiles = useMemo(() => {
    const map = new Map<string, Tile>();
    for (let la = LAT_MIN; la < LAT_MAX; la += STEP)
      for (let ln = -180; ln < 180; ln += STEP) map.set(`${la}:${ln}`, { id: `${la}:${ln}`, lat0: la, lng0: ln, sold: [] });
    for (const d of placed) map.get(tileId(d.lat!, d.lng!))?.sold.push(d);
    return [...map.values()];
  }, [placed]);
  const soldTiles = tiles.filter((t) => t.sold.length).length;

  useEffect(() => {
    let disposed = false;
    let resize: (() => void) | undefined;
    (async () => {
      const Globe = (await import("globe.gl")).default;
      if (disposed || !el.current) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const g = new Globe(el.current, { animateIn: !reduce })
        .globeImageUrl("/textures/earth-blue-marble.jpg")
        .bumpImageUrl("/textures/earth-topology.png")
        .backgroundImageUrl("/textures/night-sky.png")
        .atmosphereColor("#9bf6ff")
        .atmosphereAltitude(0.22)
        // Kun solgte felter tegnes som 3D-felter – resten af himlen er et let gitter (mange polygoner låser browseren)
        .polygonsData(tiles.filter((t) => t.sold.length).map(polygon))
        .polygonsTransitionDuration(0)
        .polygonAltitude(0.13)
        .polygonCapColor(() => "rgba(255,210,63,0.75)")
        .polygonSideColor(() => "rgba(255,183,3,0.35)")
        .polygonStrokeColor(() => "rgba(255,255,255,0.5)")
        .polygonLabel((f) => {
          const t = (f as { properties: Tile }).properties;
          const names = t.sold.map((d) => d.dedicatedTo || "en hemmelig ven").join(", ");
          return `<div style="background:#ffd23f;color:#2b2d42;padding:6px 10px;border-radius:10px;border:2px solid #2b2d42;font-weight:700">🌤️ Solgt til ${names.replace(/</g, "&lt;")}</div>`;
        })
        .onPolygonClick((f) => {
          const t = (f as { properties: Tile }).properties;
          if (t.sold[0]) setSelected(t.sold[0]);
        })
        .pathsData(skyGrid())
        .pathPoints((d) => d as [number, number][])
        .pathPointLat((p) => (p as [number, number])[0])
        .pathPointLng((p) => (p as [number, number])[1])
        .pathPointAlt(() => 0.1)
        .pathColor(() => "rgba(255,255,255,0.22)")
        .pathStroke(0.4)
        .pathTransitionDuration(0)
        .ringsData(placed)
        .ringLat((d) => (d as PublicDelivery).lat!)
        .ringLng((d) => (d as PublicDelivery).lng!)
        .ringColor(() => (t: number) => `rgba(255,210,63,${1 - t})`)
        .ringMaxRadius(4)
        .ringPropagationSpeed(2)
        .ringRepeatPeriod(1600)
        .htmlElementsData(placed)
        .htmlLat((d) => (d as PublicDelivery).lat!)
        .htmlLng((d) => (d as PublicDelivery).lng!)
        .htmlAltitude(0.16)
        .htmlElement((d) => {
          const del = d as PublicDelivery;
          const node = document.createElement("button");
          node.type = "button";
          node.textContent = del.product?.slug === "en-sky-efter-dig" ? "☁️" : "🌤️";
          node.title = del.title;
          node.style.cssText = "font-size:26px;cursor:pointer;background:none;border:0;pointer-events:auto;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))";
          node.onclick = () => setSelected(del);
          return node;
        });

      const controls = g.controls();
      controls.autoRotate = !reduce;
      controls.autoRotateSpeed = 0.5;
      g.pointOfView({ lat: 56, lng: 10, altitude: 2.3 });

      const focus = placed.find((d) => d.id === focusId);
      if (focus) {
        g.pointOfView({ lat: focus.lat!, lng: focus.lng!, altitude: 1.2 }, 2500);
        controls.autoRotate = false;
        setSelected(focus);
      }

      resize = () => {
        if (!el.current) return;
        g.width(el.current.clientWidth).height(el.current.clientHeight);
      };
      resize();
      window.addEventListener("resize", resize);
      globe.current = g;
      setReady(true);
    })();
    return () => {
      disposed = true;
      if (resize) window.removeEventListener("resize", resize);
      globe.current?._destructor();
      globe.current = null;
    };
  }, [tiles, placed, focusId]);

  return (
    <div className="relative">
      <div ref={el} className="card h-[70vh] min-h-[420px] w-full overflow-hidden bg-[#050b1f]" aria-label="3D-globus med solgte stykker himmel" role="img" />
      {!ready && (
        <p className="absolute inset-0 grid place-items-center font-display text-xl text-white">Pumper atmosfæren op … 🎈</p>
      )}
      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border-2 border-ink bg-white/90 px-3 py-2 text-sm font-bold">
        🌤️ {soldTiles} solgt · ☁️ {tiles.length - soldTiles} ledige himmelstykker
      </div>
      {selected && (
        <div className="card absolute bottom-4 left-4 right-4 max-w-sm animate-pop-in p-4 sm:right-auto">
          <button
            type="button"
            className="absolute right-3 top-2 text-xl"
            onClick={() => setSelected(null)}
            aria-label="Luk"
          >
            ✖
          </button>
          {selected.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- billede fra dagbogen
            <img src={selected.photoUrl} alt="" className="mb-3 h-40 w-full rounded-xl border-2 border-ink object-cover" />
          )}
          <p className="font-display text-lg font-bold">{selected.title}</p>
          {selected.dedicatedTo && <p>💛 Til {selected.dedicatedTo}</p>}
          {selected.placeName && <p className="text-sm">📍 {selected.placeName}</p>}
          <p className="text-sm text-ink-soft">
            {new Date(selected.deliveredAt).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          {selected.note && <p className="mt-1 text-sm">{selected.note}</p>}
        </div>
      )}
    </div>
  );
}
