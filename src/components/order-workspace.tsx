"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addOrderTask,
  deleteOrderDraft,
  deleteOrderTask,
  renameOrderTask,
  saveOrderDraft,
  setOrderTaskDone,
} from "@/app/admin/actions";
import { UploadButton } from "./upload-button";

type Task = { id: number; text: string; done: boolean };
type Draft = { id: number; title: string; body: string; imageUrl: string | null };

/** Hurtige skabeloner til nye udkast */
const DRAFT_TEMPLATES = [
  { emoji: "😂", title: "Jokes jeg vil sende" },
  { emoji: "📅", title: "Datoer og tidspunkter" },
  { emoji: "📍", title: "Steder" },
  { emoji: "ℹ️", title: "Vigtig info" },
];

/* ---------- Tjekliste ---------- */

function Checklist({ orderId, initial, suggestions }: { orderId: number; initial: Task[]; suggestions: string[] }) {
  const [tasks, setTasks] = useState(initial);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [, start] = useTransition();
  const done = tasks.filter((t) => t.done).length;
  const open = suggestions.filter((sug) => !tasks.some((t) => t.text === sug));

  function add(value: string) {
    const clean = value.trim();
    if (!clean) return;
    const tempId = -Date.now();
    setTasks((ts) => [...ts, { id: tempId, text: clean, done: false }]);
    start(async () => {
      const id = await addOrderTask(orderId, clean);
      setTasks((ts) => (id ? ts.map((t) => (t.id === tempId ? { ...t, id } : t)) : ts.filter((t) => t.id !== tempId)));
    });
  }

  function toggle(t: Task) {
    if (t.id < 0) return;
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    start(() => setOrderTaskDone(t.id, !t.done));
  }

  function rename(t: Task, value: string) {
    setEditing(null);
    const clean = value.trim();
    if (!clean || clean === t.text) return;
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, text: clean } : x)));
    start(() => renameOrderTask(t.id, clean));
  }

  function remove(t: Task) {
    if (t.id < 0) return;
    setTasks((ts) => ts.filter((x) => x.id !== t.id));
    start(() => deleteOrderTask(t.id));
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold">✅ Tjekliste</h3>
        {tasks.length > 0 && (
          <span className="text-sm font-bold text-ink-soft">
            {done} af {tasks.length} klaret{done === tasks.length ? " 🎉" : ""}
          </span>
        )}
      </div>
      {tasks.length > 0 && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream">
          <div className="h-full bg-mint transition-all" style={{ width: `${(done / tasks.length) * 100}%` }} />
        </div>
      )}

      <ul className="mt-3 space-y-1">
        {tasks.map((t) => (
          <li key={t.id} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-cream">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t)}
              className="size-5 shrink-0 cursor-pointer accent-ink"
              aria-label={`Markér “${t.text}” som klaret`}
            />
            {editing === t.id ? (
              <input
                autoFocus
                defaultValue={t.text}
                className="input !py-1"
                onBlur={(e) => rename(t, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditing(null);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => t.id > 0 && setEditing(t.id)}
                className={`flex-1 text-left ${t.done ? "text-ink-soft line-through" : "font-semibold"}`}
                title="Klik for at rette"
              >
                {t.text}
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-coral opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label={`Slet “${t.text}”`}
            >
              ✖
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(text);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Fx “Find bænk i Kongens Have”"
          className="input"
          maxLength={300}
        />
        <button className="btn btn-white shrink-0 !py-1.5" disabled={!text.trim()}>
          Tilføj
        </button>
      </form>

      {open.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {open.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => add(sug)}
              className="rounded-full border-2 border-dashed border-ink/30 px-3 py-1 text-sm hover:border-ink"
            >
              + {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Udkast ---------- */

function DraftCard({ orderId, draft, onDelete }: { orderId: number; draft: Draft; onDelete: () => void }) {
  const [d, setD] = useState(draft);
  const [state, setState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(draft);

  async function save() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setState("saving");
    const res = await saveOrderDraft({ orderId, ...latest.current });
    setState(res.ok ? "saved" : "error");
  }

  function change(patch: Partial<Draft>, immediate = false) {
    latest.current = { ...latest.current, ...patch };
    setD(latest.current);
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, immediate ? 0 : 1200);
  }

  // Gem det sidste, hvis siden forlades midt i en ændring
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void saveOrderDraft({ orderId, ...latest.current });
      }
    },
    [orderId],
  );

  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-3">
      <div className="flex items-center gap-2">
        <input
          value={d.title}
          onChange={(e) => change({ title: e.target.value })}
          onBlur={() => state === "dirty" && save()}
          placeholder="Overskrift"
          className="min-w-0 flex-1 bg-transparent font-bold outline-none"
          maxLength={200}
        />
        <span className="shrink-0 text-xs text-ink-soft">
          {state === "saving" ? "Gemmer …" : state === "dirty" ? "…" : state === "error" ? "⚠️ Ikke gemt" : "Gemt ✓"}
        </span>
        <button
          type="button"
          className="text-coral"
          aria-label="Slet udkast"
          onClick={() => {
            if (!confirm("Slet dette udkast?")) return;
            if (timer.current) clearTimeout(timer.current);
            timer.current = null;
            onDelete();
          }}
        >
          ✖
        </button>
      </div>
      <textarea
        value={d.body}
        onChange={(e) => change({ body: e.target.value })}
        onBlur={() => state === "dirty" && save()}
        placeholder="Skriv løs – jokes, datoer, adresser, idéer …"
        className="input mt-2 min-h-28"
        maxLength={20000}
      />
      {d.imageUrl ? (
        <div className="mt-2">
          <a href={d.imageUrl} target="_blank" rel="noreferrer" className="relative block aspect-video overflow-hidden rounded-xl border-2 border-ink">
            <Image src={d.imageUrl} alt={d.title} fill sizes="600px" className="object-cover" unoptimized={d.imageUrl.endsWith(".gif")} />
          </a>
          <div className="mt-2 flex gap-2">
            <UploadButton folder="forarbejde" label="🔁 Skift billede" onUploaded={(url) => change({ imageUrl: url }, true)} />
            <button type="button" className="btn btn-white !px-3 !py-1.5 text-sm" onClick={() => change({ imageUrl: null }, true)}>
              Fjern billede
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <UploadButton folder="forarbejde" label="📷 Vedhæft billede" onUploaded={(url) => change({ imageUrl: url }, true)} />
        </div>
      )}
    </div>
  );
}

function Drafts({ orderId, initial }: { orderId: number; initial: Draft[] }) {
  const [drafts, setDrafts] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function create(values: Omit<Draft, "id">) {
    setError("");
    start(async () => {
      const res = await saveOrderDraft({ orderId, ...values });
      if (!res.ok) return setError(res.error);
      setDrafts((ds) => [...ds, { id: res.id, ...values }]);
    });
  }

  function remove(id: number) {
    setDrafts((ds) => ds.filter((d) => d.id !== id));
    start(() => deleteOrderDraft(id));
  }

  return (
    <div>
      <h3 className="text-lg font-bold">📝 Udkast og forarbejde</h3>
      <p className="text-sm text-ink-soft">Gemmes automatisk, mens du skriver. Kun du kan se det.</p>

      <div className="mt-3 space-y-3">
        {drafts.map((d) => (
          <DraftCard key={d.id} orderId={orderId} draft={d} onDelete={() => remove(d.id)} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-start gap-2">
        <button
          type="button"
          className="btn btn-white !px-3 !py-1.5 text-sm"
          disabled={pending}
          onClick={() => create({ title: "", body: "", imageUrl: null })}
        >
          + Nyt udkast
        </button>
        {DRAFT_TEMPLATES.filter((t) => !drafts.some((d) => d.title === t.title)).map((t) => (
          <button
            key={t.title}
            type="button"
            className="rounded-full border-2 border-dashed border-ink/30 px-3 py-1 text-sm hover:border-ink"
            disabled={pending}
            onClick={() => create({ title: t.title, body: "", imageUrl: null })}
          >
            {t.emoji} {t.title}
          </button>
        ))}
        <UploadButton
          folder="forarbejde"
          label="📷 Kun et billede"
          onUploaded={(url) => create({ title: "Billede", body: "", imageUrl: url })}
        />
      </div>
      {error && <p className="mt-2 text-sm font-bold text-coral">{error}</p>}
    </div>
  );
}

export function OrderWorkspace({
  orderId,
  tasks,
  drafts,
  suggestions,
}: {
  orderId: number;
  tasks: Task[];
  drafts: Draft[];
  suggestions: string[];
}) {
  return (
    <section className="card space-y-6 p-5">
      <h2 className="text-xl font-bold">Forarbejde 🛠️ (kun for dig)</h2>
      <Checklist orderId={orderId} initial={tasks} suggestions={suggestions} />
      <div className="border-t-2 border-dashed border-ink/15 pt-5">
        <Drafts orderId={orderId} initial={drafts} />
      </div>
    </section>
  );
}
