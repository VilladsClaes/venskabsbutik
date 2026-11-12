"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { withdrawSignup } from "@/app/event-actions";

export function WithdrawButton({ token, people }: { token: string; people: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sure, setSure] = useState(false);
  const [error, setError] = useState("");

  if (!sure)
    return (
      <button type="button" className="btn btn-white text-coral" onClick={() => setSure(true)}>
        Meld {people > 1 ? "os" : "mig"} fra
      </button>
    );
  return (
    <div className="space-y-2">
      <p className="font-semibold">Er du sikker? {people > 1 ? `Alle ${people} på tilmeldingen bliver meldt fra.` : ""}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-coral"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await withdrawSignup(token);
              if (!res.ok) setError(res.error ?? "Det gik ikke");
              else router.refresh();
            })
          }
        >
          {pending ? "Melder fra …" : "Ja, meld fra"}
        </button>
        <button type="button" className="btn btn-white" onClick={() => setSure(false)}>
          Fortryd
        </button>
      </div>
      {error && (
        <p className="font-bold text-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
