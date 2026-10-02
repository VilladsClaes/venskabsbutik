"use client";

import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-white !px-3 !py-1 text-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* udklipsholder ikke tilgængelig */
        }
      }}
      aria-label={`Kopiér ${label}`}
    >
      {copied ? "Kopieret ✅" : "Kopiér 📋"}
    </button>
  );
}
