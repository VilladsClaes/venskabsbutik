import Link from "next/link";
import { getActivityDates } from "@/lib/events";
import { formatEventTime } from "@/lib/event-text";
import { formatKr } from "@/lib/money";
import { EventProgress } from "./event-progress";
import { InterestForm } from "./interest-form";

/** Aktivitetens kommende datoer med tilmeldte – står hvor "Læg i kurv" ellers står */
export async function ActivityDates({ productId, price }: { productId: number; price: number }) {
  const dates = await getActivityDates(productId);
  return (
    <div className="space-y-4">
      <p className="font-display text-3xl font-bold">
        {price ? formatKr(price) : "Gratis"} <span className="text-lg font-semibold text-ink-soft">pr. person</span>
      </p>
      {dates.length > 0 && (
        <div>
          <h2 className="mb-2 text-xl font-bold">Kommende datoer 📅</h2>
          <ul className="space-y-3">
            {dates.map((d) => (
              <li key={d.id} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-display font-bold first-letter:uppercase">{formatEventTime(d.startsAt, d.endsAt)}</p>
                  {d.location && <p className="text-sm text-ink-soft">📍 {d.location}</p>}
                  <EventProgress compact status={d.status} seatsTaken={d.seatsTaken} minParticipants={d.minParticipants} capacity={d.capacity} />
                </div>
                {d.seatsLeft === 0 ? (
                  <span className="font-bold text-ink-soft">Fuldt</span>
                ) : (
                  <Link href={`/kalender/${d.slug}#tilmeld`} className="btn btn-coral !py-2">
                    Tilmeld
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-sm font-semibold">💛 Du betaler først, når vi er nok til, at det bliver til noget.</p>
      <InterestForm productId={productId} hasDates={dates.length > 0} />
    </div>
  );
}
