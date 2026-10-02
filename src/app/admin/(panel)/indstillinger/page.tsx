import { saveSettings } from "@/app/admin/actions";
import { AdminTitle } from "@/components/admin-ui";
import { emailEnabled } from "@/lib/email";
import { getSettings } from "@/lib/queries";
import { uploadsEnabled } from "@/lib/upload";

const FIELDS = [
  { key: "mobilepayNumber", label: "MobilePay-nummer", hint: "Det nummer kunderne betaler til" },
  { key: "mobilepayName", label: "Navn på MobilePay", hint: "" },
  { key: "contactPhone", label: "Telefon til kontakt", hint: "Bruges til “Ring til mig” og WhatsApp" },
  { key: "contactEmail", label: "E-mail til kontakt", hint: "" },
  { key: "introVideo", label: "Intro-video på forsiden (YouTube-id)", hint: "Fx b2Wab89xhOc" },
];

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <AdminTitle>Indstillinger ⚙️</AdminTitle>
      <form action={saveSettings} className="card max-w-xl space-y-4 p-5">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-sm font-bold">{f.label}</span>
            <input name={f.key} defaultValue={settings[f.key] ?? ""} className="input mt-1" />
            {f.hint && <span className="mt-1 block text-xs text-ink-soft">{f.hint}</span>}
          </label>
        ))}
        <button className="btn btn-sun">Gem indstillinger</button>
      </form>

      <section className="card mt-8 max-w-xl space-y-3 p-5">
        <h2 className="text-xl font-bold">Tilslutninger</h2>
        {[
          {
            ok: emailEnabled(),
            name: "E-mail (Resend)",
            off: "Slået fra – kræver RESEND_API_KEY og EMAIL_FROM i Vercel",
            on: "Kunder får bekræftelse og statusmails",
          },
          {
            ok: uploadsEnabled(),
            name: "Billedupload",
            off: "Slået fra – kræver en Vercel Blob-butik (BLOB_READ_WRITE_TOKEN)",
            on: process.env.BLOB_READ_WRITE_TOKEN ? "Billeder gemmes i Vercel Blob" : "Lokalt: billeder gemmes i public/uploads",
          },
          {
            ok: !!process.env.VERCEL,
            name: "Besøgsstatistik (Vercel Analytics)",
            off: "Kører kun på Vercel",
            on: "Klar – slå “Web Analytics” til under projektets Analytics-fane i Vercel",
          },
        ].map((x) => (
          <div key={x.name} className="flex gap-3 rounded-2xl bg-cream p-3">
            <span className="text-xl" aria-hidden="true">{x.ok ? "🟢" : "⚪"}</span>
            <span>
              <span className="block font-bold">{x.name}</span>
              <span className="text-sm text-ink-soft">{x.ok ? x.on : x.off}</span>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
