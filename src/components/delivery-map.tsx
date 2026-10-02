"use client";

import { useMemo } from "react";
import type { PublicDelivery } from "@/lib/experiences";
import { escapeHtml, MapView, type MapMarker } from "./map-view";

function popup(d: PublicDelivery) {
  const date = new Date(d.deliveredAt).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
  return `<div style="font-family:var(--font-nunito),sans-serif;min-width:200px">
    ${d.photoUrl ? `<img src="${escapeHtml(d.photoUrl)}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:12px;border:2px solid #2b2d42;margin-bottom:8px">` : ""}
    <strong style="font-size:16px">${escapeHtml(d.title)}</strong>
    ${d.dedicatedTo ? `<div>💛 Til <b>${escapeHtml(d.dedicatedTo)}</b></div>` : ""}
    ${d.placeName ? `<div>📍 ${escapeHtml(d.placeName)}</div>` : ""}
    <div style="color:#5c5f7a">${date}</div>
    ${d.note ? `<p style="margin:6px 0 0">${escapeHtml(d.note)}</p>` : ""}
  </div>`;
}

export function DeliveryMap({
  deliveries,
  emoji,
  className,
  focusId,
}: {
  deliveries: PublicDelivery[];
  emoji?: string;
  className?: string;
  focusId?: number;
}) {
  const markers = useMemo<MapMarker[]>(
    () =>
      deliveries
        .filter((d) => d.lat != null && d.lng != null)
        .map((d) => ({
          id: d.id,
          lat: d.lat!,
          lng: d.lng!,
          emoji: emoji ?? d.product?.emoji ?? "📍",
          popupHtml: popup(d),
        })),
    [deliveries, emoji],
  );
  return <MapView markers={markers} className={className} focusId={focusId} />;
}
