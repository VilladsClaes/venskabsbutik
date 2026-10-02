import type { CSSProperties } from "react";

/** Smilende sol med roterende stråler og blinkende øjne */
export function Sun({ size = 220, className = "" }: { size?: number; className?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <g className="origin-center animate-spin-slow" style={{ transformBox: "fill-box" }}>
        {rays.map((deg) => (
          <path
            key={deg}
            d="M100 4 L110 34 L90 34 Z"
            fill="#ffb703"
            stroke="#2b2d42"
            strokeWidth="3"
            strokeLinejoin="round"
            transform={`rotate(${deg} 100 100)`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="58" fill="#ffd23f" stroke="#2b2d42" strokeWidth="4" />
      <g style={{ transformOrigin: "100px 90px", animation: "blink 5s infinite" }}>
        <ellipse cx="80" cy="90" rx="6" ry="9" fill="#2b2d42" />
        <ellipse cx="120" cy="90" rx="6" ry="9" fill="#2b2d42" />
        <circle cx="82" cy="87" r="2" fill="white" />
        <circle cx="122" cy="87" r="2" fill="white" />
      </g>
      <circle cx="68" cy="110" r="8" fill="#ff8fab" opacity="0.8" />
      <circle cx="132" cy="110" r="8" fill="#ff8fab" opacity="0.8" />
      <path
        d="M78 112 Q100 136 122 112"
        fill="#ff6b6b"
        stroke="#2b2d42"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Fluffy sky – med eller uden et lille smil */
export function Cloud({
  width = 180,
  face = false,
  className = "",
  style,
}: {
  width?: number;
  face?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 200 110"
      width={width}
      height={(width * 110) / 200}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M40 95 Q8 95 10 70 Q12 48 38 50 Q40 20 72 22 Q92 0 120 18 Q150 8 160 40 Q192 42 190 70 Q188 95 160 95 Z"
        fill="white"
        stroke="#2b2d42"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {face && (
        <g>
          <circle cx="85" cy="58" r="4.5" fill="#2b2d42" />
          <circle cx="118" cy="58" r="4.5" fill="#2b2d42" />
          <path d="M90 70 Q101 80 112 70" fill="none" stroke="#2b2d42" strokeWidth="4" strokeLinecap="round" />
          <circle cx="74" cy="70" r="5" fill="#ff8fab" opacity="0.7" />
          <circle cx="129" cy="70" r="5" fill="#ff8fab" opacity="0.7" />
        </g>
      )}
    </svg>
  );
}

const RAINBOW = ["#ff6b6b", "#ff9f1c", "#ffd23f", "#06d6a0", "#4d96ff", "#a66cff"];

/** Regnbue der tegner sig selv */
export function Rainbow({ width = 420, className = "" }: { width?: number; className?: string }) {
  return (
    <svg viewBox="0 0 400 210" width={width} height={(width * 210) / 400} className={className} aria-hidden="true">
      {RAINBOW.map((c, i) => {
        const r = 180 - i * 18;
        return (
          <path
            key={c}
            d={`M${200 - r} 205 A${r} ${r} 0 0 1 ${200 + r} 205`}
            fill="none"
            stroke={c}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="1000"
            style={{ animation: `rainbow-draw 2.2s ${i * 0.15}s cubic-bezier(.6,.1,.3,1) both` }}
          />
        );
      })}
    </svg>
  );
}

/** Skyer der driver hen over et område (absolut positioneret, bag indholdet) */
export function DriftingClouds({ count = 5, faces = true }: { count?: number; faces?: boolean }) {
  const clouds = [
    { top: "6%", x: "4%", w: 170, dur: 70, delay: -10, face: true },
    { top: "22%", x: "70%", w: 110, dur: 95, delay: -60, face: false },
    { top: "40%", x: "8%", w: 210, dur: 85, delay: -35, face: true },
    { top: "62%", x: "78%", w: 130, dur: 110, delay: -80, face: false },
    { top: "78%", x: "30%", w: 160, dur: 78, delay: -20, face: true },
    { top: "14%", x: "45%", w: 90, dur: 120, delay: -100, face: false },
  ].slice(0, count);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {clouds.map((c, i) => (
        <div
          key={i}
          className={`drifter absolute left-0 ${i % 2 === 0 && i > 0 ? "max-sm:hidden" : ""}`}
          style={{ top: c.top, "--x": c.x, animation: `drift ${c.dur}s linear ${c.delay}s infinite` } as CSSProperties}
        >
          <div className="origin-top-left max-sm:scale-[0.65]">
            <div className="animate-bob" style={{ animationDelay: `${i * 0.7}s` }}>
              <Cloud width={c.w} face={faces && c.face} className="opacity-95 drop-shadow-sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const DEFAULT_EMOJIS = ["😄", "🌈", "☀️", "💛", "🤗", "🎈", "🌻", "😂", "✨", "🥳", "😊", "🦄"];

/** Emojis der stiger op som balloner */
export function RisingEmojis({ emojis = DEFAULT_EMOJIS, count = 14 }: { emojis?: string[]; count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37 + 7) % 100;
        const dur = 14 + ((i * 7) % 11);
        const delay = -((i * 3.3) % dur);
        const size = 1.4 + ((i * 13) % 10) / 6;
        return (
          <span
            key={i}
            className="absolute bottom-[-3rem]"
            style={{
              left: `${left}%`,
              fontSize: `${size}rem`,
              animation: `rise ${dur}s linear ${delay}s infinite`,
            }}
          >
            {emojis[i % emojis.length]}
          </span>
        );
      })}
    </div>
  );
}

/** Bølget overgang mellem sektioner */
export function Wave({ color = "#fff8e7", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={`block h-10 w-full sm:h-16 ${flip ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path
        d="M0 40 C 180 80 360 0 540 40 C 720 80 900 0 1080 40 C 1260 80 1350 20 1440 40 L1440 80 L0 80 Z"
        fill={color}
      />
    </svg>
  );
}
