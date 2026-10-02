"use client";

import { useState } from "react";

/**
 * Viser kun et thumbnail indtil der klikkes – så siden loader hurtigt
 * og YouTube ikke sætter cookies før besøgende selv vælger at se videoen.
 */
export function YouTube({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="card relative aspect-video overflow-hidden bg-ink">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Afspil video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ekstern thumbnail */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-20 w-20 place-items-center rounded-full border-[3px] border-ink bg-coral text-3xl text-white shadow-[0_5px_0_0_#2b2d42] transition group-hover:scale-110 group-hover:animate-wiggle">
              ▶
            </span>
          </span>
          <span className="absolute bottom-3 left-3 rounded-full border-2 border-ink bg-white px-3 py-1 font-display text-sm font-semibold">
            {title}
          </span>
        </button>
      )}
    </div>
  );
}
