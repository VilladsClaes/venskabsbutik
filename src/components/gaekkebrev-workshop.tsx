"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { burstConfetti } from "./confetti";

type Pt = [number, number];
const SIZE = 560;
const PAPERS = [
  { name: "Hvid", color: "#ffffff" },
  { name: "Gul", color: "#fff1a8" },
  { name: "Lyserød", color: "#ffd6e7" },
  { name: "Lyseblå", color: "#d6ecff" },
  { name: "Mintgrøn", color: "#d4f5e4" },
];
const DEFAULT_VERSE = "Vintergækken fryser\nog pakker sig ind –\ngæt nu hvem der sendte\ndig dette brev, min ven!";

/** Tegner et klip 8 gange (4 rotationer × spejling) – som når papiret er foldet */
function drawSymmetric(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  const c = SIZE / 2;
  for (let r = 0; r < 4; r++)
    for (const mirror of [1, -1]) {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate((r * Math.PI) / 2);
      ctx.scale(mirror, 1);
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * SIZE - c, y * SIZE - c) : ctx.moveTo(x * SIZE - c, y * SIZE - c)));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
}

export function GaekkebrevWorkshop() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [cuts, setCuts] = useState<Pt[][]>([]);
  const [current, setCurrent] = useState<Pt[] | null>(null);
  const [paper, setPaper] = useState(PAPERS[1].color);
  const [verse, setVerse] = useState(DEFAULT_VERSE);
  const [sender, setSender] = useState("");

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, withGuides: boolean) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      // Papiret (lagt på et eget lag, så klippene kun fjerner papir)
      const off = document.createElement("canvas");
      off.width = off.height = SIZE;
      const p = off.getContext("2d")!;
      p.fillStyle = paper;
      p.beginPath();
      p.roundRect(8, 8, SIZE - 16, SIZE - 16, 18);
      p.fill();
      p.globalCompositeOperation = "destination-out";
      p.fillStyle = "#000";
      for (const cut of cuts) if (cut.length > 2) drawSymmetric(p, cut);
      if (current && current.length > 2) drawSymmetric(p, current);
      ctx.drawImage(off, 0, 0);
      if (withGuides) {
        ctx.save();
        ctx.strokeStyle = "rgba(43,45,66,.18)";
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(SIZE / 2, 0);
        ctx.lineTo(SIZE / 2, SIZE);
        ctx.moveTo(0, SIZE / 2);
        ctx.lineTo(SIZE, SIZE / 2);
        ctx.moveTo(0, 0);
        ctx.lineTo(SIZE, SIZE);
        ctx.moveTo(SIZE, 0);
        ctx.lineTo(0, SIZE);
        ctx.stroke();
        ctx.restore();
        if (current && current.length > 1) {
          ctx.strokeStyle = "#ff6b6b";
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.beginPath();
          current.forEach(([x, y], i) => (i ? ctx.lineTo(x * SIZE, y * SIZE) : ctx.moveTo(x * SIZE, y * SIZE)));
          ctx.stroke();
        }
      }
    },
    [cuts, current, paper],
  );

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) render(ctx, true);
  }, [render]);

  function point(e: React.PointerEvent): Pt {
    const r = canvas.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  }

  function onDown(e: React.PointerEvent) {
    canvas.current?.setPointerCapture(e.pointerId);
    setCurrent([point(e)]);
  }
  function onMove(e: React.PointerEvent) {
    if (!current) return;
    const p = point(e);
    const last = current[current.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.004) setCurrent([...current, p]);
  }
  function onUp() {
    if (current && current.length > 2) setCuts((c) => [...c, current]);
    setCurrent(null);
  }

  const dots = sender.replace(/\s/g, "").length;

  function download() {
    // Saml et helt kort: det klippede brev + verset
    const W = SIZE + 80;
    const lines = verse.split("\n");
    const H = SIZE + 120 + lines.length * 34 + 60;
    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#8ecae6";
    ctx.fillRect(0, 0, W, H);
    const brev = document.createElement("canvas");
    brev.width = brev.height = SIZE;
    render(brev.getContext("2d")!, false);
    ctx.drawImage(brev, 40, 40);
    ctx.fillStyle = "#2b2d42";
    ctx.textAlign = "center";
    ctx.font = "600 26px Fredoka, sans-serif";
    lines.forEach((l, i) => ctx.fillText(l, W / 2, SIZE + 90 + i * 34));
    ctx.font = "700 30px Fredoka, sans-serif";
    ctx.fillText(dots ? "Mit navn det står med prikker: " + "• ".repeat(dots).trim() : "", W / 2, SIZE + 100 + lines.length * 34 + 20);
    const a = document.createElement("a");
    a.download = "gaekkebrev.png";
    a.href = out.toDataURL("image/png");
    a.click();
    const r = canvas.current?.getBoundingClientRect();
    if (r) burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="card relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden bg-[repeating-conic-gradient(#e9f4ff_0_25%,#ffffff_0_50%)] bg-[length:28px_28px] p-0">
          <canvas
            ref={canvas}
            width={SIZE}
            height={SIZE}
            className="h-full w-full touch-none cursor-crosshair"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-label="Klippeflade: træk med musen eller fingeren for at klippe i papiret"
          />
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-ink-soft">
          ✂️ Træk en lukket form med musen eller fingeren – papiret er foldet, så hvert klip bliver til 8.
        </p>
      </div>

      <div className="space-y-5">
        <div className="card space-y-3 p-4">
          <p className="font-display text-lg font-bold">Papir</p>
          <div className="flex flex-wrap gap-2">
            {PAPERS.map((p) => (
              <button
                key={p.color}
                type="button"
                onClick={() => setPaper(p.color)}
                aria-pressed={paper === p.color}
                aria-label={p.name}
                className={`h-10 w-10 rounded-full border-[3px] border-ink ${paper === p.color ? "ring-4 ring-sun" : ""}`}
                style={{ background: p.color }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-white !px-3 !py-1.5 text-sm" onClick={() => setCuts((c) => c.slice(0, -1))} disabled={!cuts.length}>
              ↩️ Fortryd
            </button>
            <button type="button" className="btn btn-white !px-3 !py-1.5 text-sm" onClick={() => setCuts([])} disabled={!cuts.length}>
              🧻 Nyt papir
            </button>
          </div>
        </div>
        <div className="card space-y-3 p-4">
          <label className="block">
            <span className="font-display text-lg font-bold">Gækkeverset</span>
            <textarea className="input mt-1 min-h-32" value={verse} onChange={(e) => setVerse(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Dit navn (bliver til prikker)</span>
            <input className="input mt-1" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Fx Villads" />
          </label>
          <p className="font-display text-lg">
            Mit navn det står med prikker: <span className="tracking-[0.3em]">{"•".repeat(dots) || "…"}</span>
          </p>
        </div>
        <button type="button" className="btn btn-coral w-full text-lg" onClick={download}>
          📥 Hent mit gækkebrev
        </button>
        <Link href="/tjenester/gaekkebrev" className="btn btn-sun w-full">
          ✉️ Bestil et rigtigt fra Villads
        </Link>
      </div>
    </div>
  );
}
