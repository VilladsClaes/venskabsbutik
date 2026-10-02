import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "audio/mpeg", "audio/mp4", "audio/x-m4a"];
const MAX_BYTES = 4 * 1024 * 1024;

export function uploadsEnabled() {
  return !!process.env.BLOB_READ_WRITE_TOKEN || process.env.NODE_ENV !== "production";
}

/**
 * Gemmer en fil fra admin og returnerer dens offentlige adresse.
 * I drift bruges Vercel Blob (kræver BLOB_READ_WRITE_TOKEN); lokalt gemmes i public/uploads.
 */
export async function saveUpload(file: File, folder: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Kun billeder (JPG, PNG, WebP, GIF) og lyd (MP3, M4A) er tilladt");
  if (file.size > MAX_BYTES) throw new Error("Filen er for stor (max 4 MB)");
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
  const ext = (extname(file.name) || ".jpg").toLowerCase().replace(/[^.a-z0-9]/g, "");
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${safeFolder}/${name}`, file, { access: "public", contentType: file.type });
    return blob.url;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Billedupload er ikke sat op endnu (mangler BLOB_READ_WRITE_TOKEN i Vercel)");
  }
  const dir = join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${safeFolder}/${name}`;
}
