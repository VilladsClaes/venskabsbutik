const COLORS = ["#ff6b6b", "#ffd23f", "#06d6a0", "#4d96ff", "#a66cff", "#ff8fab"];
const EMOJIS = ["🎉", "💛", "😄", "✨", "🌈"];

/** Lille konfetti-eksplosion fra et punkt på skærmen */
export function burstConfetti(x: number, y: number, amount = 26) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < amount; i++) {
    const el = document.createElement("span");
    const isEmoji = i % 5 === 0;
    const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.5;
    const dist = 80 + Math.random() * 120;
    el.textContent = isEmoji ? EMOJIS[i % EMOJIS.length] : "";
    Object.assign(el.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      width: isEmoji ? "auto" : "10px",
      height: isEmoji ? "auto" : "14px",
      fontSize: "20px",
      background: isEmoji ? "transparent" : COLORS[i % COLORS.length],
      borderRadius: "3px",
      pointerEvents: "none",
      zIndex: "9999",
      animation: `confetti-fall ${0.8 + Math.random() * 0.6}s cubic-bezier(.2,.8,.4,1) forwards`,
    } satisfies Partial<CSSStyleDeclaration>);
    el.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    el.style.setProperty("--dy", `${Math.sin(angle) * dist + 120}px`);
    el.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
}
