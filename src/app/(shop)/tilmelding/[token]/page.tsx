import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventProgress } from "@/components/event-progress";
import { ExperienceHero } from "@/components/experience-bits";
import { ShareBar } from "@/components/share";
import { WithdrawButton } from "@/components/withdraw-button";
import { eventPageUrl, formatMoment } from "@/lib/event-text";
import { checkDeadlinesSoon, effectiveDeadline, formatEventTime, getSignupGroup } from "@/lib/events";
import { formatKr } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Din tilmelding", robots: { index: false } };

/** Siden bag linket i tilmeldingsmailen: status, hvem der er med, betaling og afmelding */
export default async function SignupPage({ params, searchParams }: PageProps<"/tilmelding/[token]">) {
  const { token } = await params;
  const { ny } = await searchParams;
  const group = await getSignupGroup(token);
  if (!group) notFound();
  checkDeadlinesSoon();
  const { event, signups } = group;
  const active = signups.filter((x) => x.status !== "annulleret");
  const payer = active.find((x) => x.isBooker) ?? active[0];
  const order = payer?.order;
  const withdrawn = active.length === 0;
  const unpaid = order?.status === "afventer_betaling";

  return (
    <>
      <ExperienceHero emoji={event.emoji} title={event.title} color={event.color} back={{ href: `/kalender/${event.slug}`, label: "← Til eventet" }}>
        <span className="first-letter:uppercase">{formatEventTime(event.startsAt, event.endsAt)}</span>
        {event.location && <span className="block">📍 {event.location}</span>}
      </ExperienceHero>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        {ny && !withdrawn && (
          <p className="card animate-pop-in bg-mint p-5 font-display text-xl font-bold" role="status">
            {event.status === "gennemfoeres" ? "Du er med! 🎉 Invitationen er på vej til jeres e-mails." : "Du er tilmeldt! 🎉 Du har fået en mail med det hele."}
          </p>
        )}

        <section className="card space-y-4 p-6">
          <h1 className="text-2xl font-bold">{withdrawn ? "Du er meldt fra" : active.length > 1 ? `I er ${active.length} på tilmeldingen` : "Din tilmelding"}</h1>
          {!withdrawn && (
            <ul className="space-y-1">
              {active.map((x) => (
                <li key={x.id} className="font-semibold">
                  {x.status === "bekraeftet" ? "✅" : "📝"} {x.name} <span className="font-normal text-ink-soft">{x.email}</span>
                </li>
              ))}
            </ul>
          )}
          <EventProgress status={event.status} seatsTaken={event.seatsTaken} minParticipants={event.minParticipants} capacity={event.capacity} />

          {withdrawn ? (
            <p>Du er velkommen tilbage, hvis du ombestemmer dig.</p>
          ) : event.status === "aflyst" ? (
            <p>Eventet er desværre aflyst. {event.cancelReason}</p>
          ) : event.status === "samler" ? (
            <p>
              Du betaler ikke noget endnu. Når vi er mindst {event.minParticipants}, får {active.length > 1 ? "I" : "du"} en kalenderinvitation
              {event.price ? " og et link til betaling" : ""}. Fristen er {formatMoment(effectiveDeadline(event))}.
            </p>
          ) : (
            <p>
              📅 Det bliver til noget! {active.length > 1 ? "I" : "Du"} har fået en kalenderinvitation fra Villads – sig ja til den, så ligger
              eventet i kalenderen.
            </p>
          )}

          {order && order.total > 0 && event.status !== "aflyst" && (
            <div className={`rounded-2xl border-[3px] border-ink p-4 ${unpaid ? "bg-sun" : "bg-mint/40"}`}>
              <p className="font-display text-lg font-bold">
                {unpaid ? `Mangler betaling: ${formatKr(order.total)}` : `Betalt ${formatKr(order.total)} 💛`}
              </p>
              <Link href={`/ordre/${order.orderNumber}?k=${order.accessToken}`} className={`btn mt-2 ${unpaid ? "btn-coral" : "btn-white"}`}>
                {unpaid ? "Betal nu" : "Se ordren"}
              </Link>
            </div>
          )}

          {!withdrawn && event.status === "samler" && event.startsAt > new Date() && (
            <div className="border-t-2 border-ink/10 pt-4">
              <WithdrawButton token={token} people={active.length} />
            </div>
          )}
          {!withdrawn && event.status === "gennemfoeres" && (
            <p className="border-t-2 border-ink/10 pt-4 text-sm text-ink-soft">
              Kan du ikke alligevel? Skriv til Villads – de andre regner med dig.
            </p>
          )}
        </section>

        {event.status === "samler" && !withdrawn && (
          <section className="card space-y-3 p-6">
            <h2 className="text-xl font-bold">Hjælp os med at blive nok 📣</h2>
            <p>Del eventet med dem, der også skal med:</p>
            <ShareBar url={eventPageUrl(event.slug)} title={`${event.emoji} ${event.title}`} text={event.summary || `Kom med til ${event.title}!`} />
          </section>
        )}
      </div>
    </>
  );
}
