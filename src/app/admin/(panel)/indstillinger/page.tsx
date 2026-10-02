import { saveSettings } from "@/app/admin/actions";
import { AdminTitle } from "@/components/admin-ui";
import { getSettings } from "@/lib/queries";

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
    </div>
  );
}
