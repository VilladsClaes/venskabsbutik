"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductVisual } from "./product-bits";

type Img = { url: string; alt: string; caption: string; isExample: boolean };

export function Gallery({ images, emoji, color, name }: { images: Img[]; emoji: string; color: string; name: string }) {
  const [i, setI] = useState(0);
  const current = images[i];
  return (
    <div>
      <div className="card group relative -rotate-1 overflow-hidden">
        <ProductVisual
          image={current?.url}
          emoji={emoji}
          color={color}
          alt={current?.alt || name}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="aspect-square sm:aspect-[4/3] lg:aspect-square"
        />
        {current?.isExample && (
          <span className="absolute left-3 top-3 rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-bold">
            📸 Fra en tidligere køber
          </span>
        )}
        {current?.caption && (
          <p className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 px-3 py-1.5 text-sm font-semibold">
            {current.caption}
          </p>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((img, j) => (
            <button
              key={img.url}
              type="button"
              aria-pressed={i === j}
              aria-label={img.alt || `Billede ${j + 1}`}
              onClick={() => setI(j)}
              className={`relative h-20 w-20 overflow-hidden rounded-2xl border-[3px] border-ink transition ${
                i === j ? "scale-105 shadow-[0_4px_0_0_#2b2d42]" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="80px"
                unoptimized={img.url.endsWith(".gif")}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
