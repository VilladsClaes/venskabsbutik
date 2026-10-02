import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sun } from "@/components/sky";
import { checkPassword, createSession, isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin-login", robots: { index: false } };

async function login(form: FormData) {
  "use server";
  // Lille forsinkelse gør det dyrere at gætte adgangskoden
  await new Promise((r) => setTimeout(r, 400));
  if (!checkPassword(String(form.get("password") ?? ""))) redirect("/admin/login?fejl=1");
  await createSession();
  redirect("/admin");
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { fejl } = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-sky to-cream px-4">
      <form action={login} className="card w-full max-w-sm space-y-4 p-8 text-center">
        <Sun size={110} className="mx-auto" />
        <h1 className="text-3xl font-bold">Butikkens baglokale</h1>
        <label className="block text-left">
          <span className="font-semibold">Adgangskode</span>
          <input name="password" type="password" className="input mt-1" autoComplete="current-password" required autoFocus />
        </label>
        {fejl && <p className="font-bold text-coral">Forkert adgangskode 🙈</p>}
        <button className="btn btn-sun w-full">Lås op 🔓</button>
      </form>
    </div>
  );
}
