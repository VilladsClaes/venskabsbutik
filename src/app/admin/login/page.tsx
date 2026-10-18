import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sun } from "@/components/sky";
import { attemptLogin, isAdmin, totpEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin-login", robots: { index: false } };

async function login(form: FormData) {
  "use server";
  // Lille forsinkelse gør det dyrere at gætte adgangskoden
  await new Promise((r) => setTimeout(r, 400));
  const res = await attemptLogin(String(form.get("password") ?? ""), String(form.get("code") ?? ""));
  if (!res.ok) redirect(res.error === "laast" ? `/admin/login?laast=${res.minutes}` : "/admin/login?fejl=1");
  redirect("/admin");
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { fejl, laast } = await searchParams;
  const twoFactor = totpEnabled();
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-sky to-cream px-4">
      <form action={login} className="card w-full max-w-sm space-y-4 p-8 text-center">
        <Sun size={110} className="mx-auto" />
        <h1 className="text-3xl font-bold">Butikkens baglokale</h1>
        <label className="block text-left">
          <span className="font-semibold">Adgangskode</span>
          <input name="password" type="password" className="input mt-1" autoComplete="current-password" required autoFocus />
        </label>
        {twoFactor && (
          <label className="block text-left">
            <span className="font-semibold">Kode fra din godkendelsesapp</span>
            <input
              name="code"
              className="input mt-1 tracking-widest"
              inputMode="numeric"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              autoComplete="one-time-code"
              placeholder="123 456"
              required
            />
          </label>
        )}
        {fejl && <p className="font-bold text-coral">{twoFactor ? "Forkert adgangskode eller kode 🙈" : "Forkert adgangskode 🙈"}</p>}
        {laast && (
          <p className="font-bold text-coral">
            For mange forsøg. Prøv igen om {Number(laast) || 15} {Number(laast) === 1 ? "minut" : "minutter"} ⏳
          </p>
        )}
        <button className="btn btn-sun w-full">Lås op 🔓</button>
      </form>
    </div>
  );
}
