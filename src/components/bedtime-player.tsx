"use client";

import { useRef, useState } from "react";

type Story = { id: number; url: string; title: string; caption: string };

/** Afspiller med stjernehimmel. Månen "sover", når der ikke spilles. */
export function BedtimePlayer({ stories }: { stories: Story[] }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<Story | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function play(s: Story) {
    const a = audio.current;
    if (!a) return;
    if (current?.id === s.id) {
      if (a.paused) void a.play();
      else a.pause();
      return;
    }
    setCurrent(s);
    a.src = s.url;
    void a.play();
  }

  const stars = Array.from({ length: 60 }, (_, i) => ({
    left: (i * 53) % 100,
    top: (i * 37) % 100,
    size: 1 + ((i * 7) % 3),
    delay: (i % 10) * 0.4,
  }));

  return (
    <div className="card relative overflow-hidden bg-gradient-to-b from-[#0b1340] via-[#1d2a6b] to-[#3a0ca3] p-6 text-white sm:p-10">
      <style>{`@keyframes twinkle{0%,100%{opacity:.25}50%{opacity:1}}`}</style>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animation: `twinkle ${2 + (i % 4)}s ${s.delay}s infinite`,
          }}
          aria-hidden="true"
        />
      ))}
      <div className="relative text-center">
        <p className={`text-7xl transition ${playing ? "animate-float" : ""}`} aria-hidden="true">
          {playing ? "🌝" : "🌙"}
        </p>
        <p className="mt-2 font-display text-xl font-semibold">
          {current ? (playing ? `Nu læser jeg: ${current.title}` : `På pause: ${current.title}`) : "Vælg en historie og læg dig godt til rette"}
        </p>
        <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-white/20" aria-hidden="true">
          <div className="h-full bg-sun transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <audio
        ref={audio}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        }}
        preload="none"
      />
      <ul className="relative mt-8 grid gap-3">
        {stories.map((s) => {
          const active = current?.id === s.id && playing;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => play(s)}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-white/40 bg-white/10 px-4 py-3 text-left transition hover:bg-white/20"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sun text-xl text-ink" aria-hidden="true">
                  {active ? "⏸" : "▶"}
                </span>
                <span>
                  <span className="block font-display text-lg font-bold">{s.title}</span>
                  {s.caption && <span className="block text-sm text-white/80">{s.caption}</span>}
                </span>
                <span className="sr-only">{active ? "Pause" : "Afspil"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
