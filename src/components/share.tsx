"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { burstConfetti } from "./confetti";
import { useWishlist } from "./wishlist";

type Target = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  href: (url: string, text: string, image?: string) => string;
  popup?: boolean;
  mobileOnly?: boolean;
};

const enc = encodeURIComponent;

const TARGETS: Target[] = [
  {
    key: "facebook",
    label: "Facebook",
    emoji: "📘",
    color: "#1877f2",
    popup: true,
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}`,
  },
  {
    key: "messenger",
    label: "Messenger",
    emoji: "💬",
    color: "#a033ff",
    mobileOnly: true,
    href: (u) => `fb-messenger://share/?link=${enc(u)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    emoji: "🟢",
    color: "#25d366",
    href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}`,
  },
  {
    key: "x",
    label: "X",
    emoji: "✖️",
    color: "#111111",
    popup: true,
    href: (u, t) => `https://x.com/intent/post?text=${enc(t)}&url=${enc(u)}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    emoji: "💼",
    color: "#0a66c2",
    popup: true,
    href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}`,
  },
  {
    key: "pinterest",
    label: "Pinterest",
    emoji: "📌",
    color: "#e60023",
    popup: true,
    href: (u, t, img) =>
      `https://pinterest.com/pin/create/button/?url=${enc(u)}&description=${enc(t)}${img ? `&media=${enc(img)}` : ""}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    emoji: "✈️",
    color: "#229ed9",
    href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}`,
  },
  {
    key: "email",
    label: "E-mail",
    emoji: "✉️",
    color: "#ff9f1c",
    href: (u, t) => `mailto:?subject=${enc(t)}&body=${enc(`${t}\n\n${u}`)}`,
  },
  {
    key: "sms",
    label: "SMS",
    emoji: "📱",
    color: "#06d6a0",
    mobileOnly: true,
    href: (u, t) => `sms:?&body=${enc(`${t} ${u}`)}`,
  },
];

function openPopup(href: string) {
  const w = 620;
  const h = 560;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const win = window.open(href, "del", `width=${w},height=${h},left=${left},top=${top},noopener`);
  if (!win) window.open(href, "_blank", "noopener");
}

/** Delingsknapper til sociale medier, Ønskeskyen og butikkens egen ønskeliste */
export function ShareBar({
  url,
  title,
  text,
  image,
  slug,
}: {
  url: string;
  title: string;
  text: string;
  image?: string;
  /** Angives på produktsider: viser "Gem på min ønskeliste" og "Tilføj til Ønskeskyen" */
  slug?: string;
}) {
  const wishlist = useWishlist();
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const heartRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-egenskaber kendes først efter hydrering
    setCanNativeShare(typeof navigator.share === "function");
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const saved = slug ? wishlist.has(slug) : false;

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* brugeren lukkede delingsmenuen */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Kopiér linket:", url);
    }
  }

  function toggleWish() {
    if (!slug) return;
    const added = wishlist.toggle(slug);
    const r = heartRef.current?.getBoundingClientRect();
    if (added && r) burstConfetti(r.left + r.width / 2, r.top + r.height / 2, 16);
  }

  const targets = TARGETS.filter((t) => !t.mobileOnly || isMobile);

  return (
    <div className="card space-y-4 p-5">
      <p className="font-display text-xl font-bold">Ønsk dig den eller del den 💝</p>

      {slug && (
        <div className="flex flex-wrap gap-2">
          {/* Ønskeskyens officielle knap-script. Det åbner deres "tilføj ønske"-vindue og henter
              selv titel, billede og pris fra produktsiden (via Open Graph og strukturerede data). */}
          <Script
            id="gowish-iframescript"
            src="https://storage.googleapis.com/gowish-button-prod/js/gowish-iframe.js"
            strategy="lazyOnload"
          />
          <button
            ref={heartRef}
            type="button"
            onClick={toggleWish}
            aria-pressed={saved}
            className={`btn !px-4 !py-2 ${saved ? "btn-coral" : "btn-white"}`}
          >
            {saved ? "💖 På din ønskeliste" : "🤍 Gem på min ønskeliste"}
          </button>
          {/* Id og ren tekst er påkrævet af Ønskeskyens script (det lytter efter klik på netop dette id) */}
          <button
            id="gowishBlueButton"
            type="button"
            data-producturl={url}
            className="btn !border-[#2b2d42] !bg-[#5fb4ff] !px-4 !py-2 text-white"
          >
            ☁️ Tilføj til Ønskeskyen
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Del på sociale medier">
        {canNativeShare && (
          <button type="button" onClick={nativeShare} className="btn btn-sun !px-3.5 !py-1.5 text-sm">
            📤 Del …
          </button>
        )}
        {targets.map((t) => {
          const href = t.href(url, text, image);
          return (
            <a
              key={t.key}
              href={href}
              target={t.key === "email" || t.key === "sms" || t.key === "messenger" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={(e) => {
                if (t.popup) {
                  e.preventDefault();
                  openPopup(href);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#2b2d42]"
              style={{ background: t.color }}
              aria-label={`Del på ${t.label}`}
            >
              <span aria-hidden="true">{t.emoji}</span>
              {t.label}
            </a>
          );
        })}
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#2b2d42]"
        >
          {copied ? "✅ Kopieret!" : "🔗 Kopiér link"}
        </button>
      </div>
      <p className="text-xs text-ink-soft">
        Instagram, Snapchat og TikTok deler du via “Del …” på mobilen eller ved at kopiere linket.
      </p>
    </div>
  );
}
