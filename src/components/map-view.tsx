"use client";

import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";
import type * as Leaflet from "leaflet";
import { useEffect, useRef } from "react";

export type MapMarker = {
  id: string | number;
  lat: number;
  lng: number;
  emoji: string;
  /** Færdig HTML til popup – skal være escaped af kalderen */
  popupHtml?: string;
  dim?: boolean;
};

export type MapRoute = { id: string; name: string; color: string; geojson: GeoJsonObject };

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Interaktivt kort. Leaflet indlæses først i browseren. */
export function MapView({
  markers = [],
  routes = [],
  center = [56.2, 10.2],
  zoom = 7,
  fit = true,
  onPick,
  picked,
  className = "h-[520px]",
  focusId,
}: {
  markers?: MapMarker[];
  routes?: MapRoute[];
  center?: [number, number];
  zoom?: number;
  fit?: boolean;
  /** Gør kortet til en positionsvælger */
  onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null;
  className?: string;
  focusId?: string | number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const pickMarker = useRef<Leaflet.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Opret kortet én gang
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      L.current = leaflet;
      const m = leaflet.map(el.current, { scrollWheelZoom: false }).setView(center, zoom);
      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        })
        .addTo(m);
      m.on("click", (e) => onPickRef.current?.(e.latlng.lat, e.latlng.lng));
      // Rul-zoom først når man har klikket på kortet – så siden kan scrolles forbi
      m.on("focus", () => m.scrollWheelZoom.enable());
      m.on("blur", () => m.scrollWheelZoom.disable());
      layer.current = leaflet.layerGroup().addTo(m);
      map.current = m;
      draw();
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kortet oprettes kun én gang
  }, []);

  function icon(emoji: string, dim = false) {
    return L.current!.divIcon({
      className: "",
      html: `<div style="font-size:30px;line-height:1;filter:drop-shadow(0 3px 0 rgba(43,45,66,.6));opacity:${dim ? 0.45 : 1};transform:translate(-50%,-90%)">${emoji}</div>`,
      iconSize: [0, 0],
    });
  }

  function draw() {
    const leaflet = L.current;
    const m = map.current;
    const group = layer.current;
    if (!leaflet || !m || !group) return;
    group.clearLayers();
    const bounds: [number, number][] = [];
    for (const r of routes) {
      const gj = leaflet.geoJSON(r.geojson, {
        style: { color: r.color, weight: 5, opacity: 0.85 },
        pointToLayer: (_f, latlng) => leaflet.circleMarker(latlng, { radius: 4, color: r.color }),
      });
      gj.bindTooltip(escapeHtml(r.name), { sticky: true });
      gj.addTo(group);
      const b = gj.getBounds();
      if (b.isValid()) bounds.push([b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]);
    }
    for (const mk of markers) {
      const marker = leaflet.marker([mk.lat, mk.lng], { icon: icon(mk.emoji, mk.dim), keyboard: true });
      if (mk.popupHtml) marker.bindPopup(mk.popupHtml, { maxWidth: 280 });
      marker.addTo(group);
      bounds.push([mk.lat, mk.lng]);
      if (focusId != null && mk.id === focusId) setTimeout(() => marker.openPopup(), 300);
    }
    if (fit && bounds.length > 1) m.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    else if (fit && bounds.length === 1) m.setView(bounds[0], 11);
  }

  useEffect(draw, [markers, routes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Positionsvælgerens nål
  useEffect(() => {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m) return;
    pickMarker.current?.remove();
    pickMarker.current = picked ? leaflet.marker([picked.lat, picked.lng], { icon: icon("📍") }).addTo(m) : null;
    if (picked) m.panTo([picked.lat, picked.lng]);
  }, [picked]);  

  return (
    <div
      ref={el}
      className={`card relative z-0 overflow-hidden ${className}`}
      role="region"
      aria-label="Kort"
      tabIndex={0}
    />
  );
}
