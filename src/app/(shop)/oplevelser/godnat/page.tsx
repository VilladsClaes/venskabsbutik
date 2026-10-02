import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { BedtimePlayer } from "@/components/bedtime-player";
import { BuyCta, ExperienceHero } from "@/components/experience-bits";
import { db, schema as s } from "@/db";

export const metadata: Metadata = {
  title: "Godnathistorierne",
  description: "Lyt til Villads' indtalte godnathistorier under en stjernehimmel.",
};

export default async function BedtimePage() {
  const audio = await db
    .select({ id: s.productMedia.id, url: s.productMedia.url, alt: s.productMedia.alt, caption: s.productMedia.caption })
    .from(s.productMedia)
    .where(eq(s.productMedia.kind, "audio"))
    .orderBy(asc(s.productMedia.sortOrder));
  const stories = audio.map((a, i) => ({ id: a.id, url: a.url, title: a.alt || `Godnathistorie nr. ${i + 1}`, caption: a.caption }));

  return (
    <>
      <ExperienceHero emoji="🌙" title="Godnathistorierne" color="#c8b6ff">
        Historier til oplæsning for børn og voksne – uden magiske tal og fantasidyr, men med masser af brugbar viden. Og
        altid positive.
      </ExperienceHero>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        {stories.length > 0 ? (
          <BedtimePlayer stories={stories} />
        ) : (
          <div className="card bg-gradient-to-b from-[#0b1340] to-[#3a0ca3] p-10 text-center text-white">
            <p className="text-6xl" aria-hidden="true">😴</p>
            <p className="mt-3 font-display text-2xl font-bold">Historierne sover stadig</p>
            <p className="mt-1">De første indtalte historier kommer snart. Indtil da kan du lytte på min podcast.</p>
          </div>
        )}
        <p className="text-center">
          🎧 Flere historier på podcasten{" "}
          <a href="https://villadsclaes.substack.com/" target="_blank" rel="noreferrer" className="font-bold underline">
            “Du bør kommentere”
          </a>
        </p>
        <BuyCta slug="godnathistorie" label="Bestil din helt egen godnathistorie 🌙" />
      </div>
    </>
  );
}
