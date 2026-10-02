import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/queries";
import { formatKr } from "@/lib/money";
import { SITE_HOST } from "@/lib/site";

// Delingsbillede der vises, når et produkt deles på Facebook, Messenger, Ønskeskyen m.fl.

// Fast adresse (/og/<slug>), så billedet også kan bruges i strukturerede data og på Pinterest.
const size = { width: 1200, height: 630 };

const fredoka = readFile(join(process.cwd(), "assets/Fredoka-Bold.ttf"));

async function loadPhoto(url?: string) {
  // Kun JPG/PNG understøttes i billedgeneratoren (ikke GIF)
  if (!url || !url.startsWith("/images/") || !/\.(jpe?g|png)$/i.test(url)) return null;
  try {
    const data = await readFile(join(process.cwd(), "public", url));
    const mime = url.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: RouteContext<"/og/[slug]">) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  const font = await fredoka;

  const name = p?.name ?? "Venskabsbutikken";
  const tagline = p?.tagline ?? "Venskaber til salg";
  const emoji = p?.emoji ?? "🌞";
  const color = p?.color ?? "#ffd23f";
  const photo = await loadPhoto(p?.media.find((m) => m.kind === "image" && !m.isExample)?.url);
  const variantPrices = p?.variants.map((v) => v.price ?? p.price) ?? [];
  const from = variantPrices.length ? Math.min(...variantPrices) : p?.price;
  const price =
    p?.priceKind === "custom"
      ? "Du vælger beløbet"
      : from != null
        ? `${new Set(variantPrices).size > 1 ? "fra " : ""}${formatKr(from)}`
        : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(180deg, #8ecae6 0%, #bde0fe 55%, #fff8e7 100%)",
          fontFamily: "Fredoka",
          color: "#2b2d42",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", right: 40, top: 20, fontSize: 120, display: "flex" }}>☀️</div>
        <div style={{ position: "absolute", left: 470, top: 30, fontSize: 70, display: "flex" }}>☁️</div>
        <div style={{ position: "absolute", right: 260, bottom: 30, fontSize: 60, display: "flex" }}>🌈</div>

        <div style={{ display: "flex", alignItems: "center", padding: 60, gap: 56, width: "100%" }}>
          <div
            style={{
              width: 420,
              height: 420,
              borderRadius: 48,
              border: "8px solid #2b2d42",
              boxShadow: "0 14px 0 0 #2b2d42",
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              transform: "rotate(-3deg)",
              flexShrink: 0,
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- ImageResponse kræver <img>
              <img src={photo} alt="" width={420} height={420} style={{ objectFit: "cover", width: 420, height: 420 }} />
            ) : (
              <div style={{ fontSize: 220, display: "flex" }}>{emoji}</div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "white",
                border: "5px solid #2b2d42",
                borderRadius: 999,
                padding: "8px 24px",
                fontSize: 32,
              }}
            >
              {`${emoji} ${tagline}`}
            </div>
            <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05, marginTop: 24 }}>{name}</div>
            {price && (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  marginTop: 28,
                  background: "#ffd23f",
                  border: "5px solid #2b2d42",
                  borderRadius: 999,
                  padding: "8px 28px",
                  fontSize: 44,
                  boxShadow: "0 7px 0 0 #2b2d42",
                }}
              >
                {price}
              </div>
            )}
            <div style={{ display: "flex", marginTop: 40, fontSize: 30, color: "#5c5f7a" }}>
              {`🌞 Venskabsbutikken · ${SITE_HOST}`}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fredoka", data: font, weight: 700, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    },
  );
}
