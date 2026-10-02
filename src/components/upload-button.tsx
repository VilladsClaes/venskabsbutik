"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/app/admin/actions";

/** Formindsker store fotos i browseren, så de holder sig under uploadgrænsen */
async function shrinkImage(file: File, maxSide = 1800): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function UploadButton({
  folder,
  onUploaded,
  accept = "image/*",
  label = "📤 Upload",
}: {
  folder: string;
  onUploaded: (url: string) => void;
  accept?: string;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handle(file: File) {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("file", await shrinkImage(file));
      fd.set("folder", folder);
      const res = await uploadMedia(fd);
      if (res.ok) onUploaded(res.url);
      else setError(res.error);
    } catch {
      setError("Upload fejlede – prøv igen");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <span className="inline-flex flex-col">
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
      <button
        type="button"
        className="btn btn-white !px-3 !py-1.5 text-sm"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "Uploader … ⏳" : label}
      </button>
      {error && <span className="mt-1 text-xs font-bold text-coral">{error}</span>}
    </span>
  );
}
