import { Building2, Check, ExternalLink, MapPin, Minus } from "lucide-react";
import { Match } from "@/lib/types";
import ScoreRing from "./ScoreRing";

interface Props {
  match: Match;
  /** Position in the list, used to stagger the entrance. */
  index: number;
}

/** Offers are stored as annual salary; people read jobs in monthly terms. */
function formatSalary(match: Match): string | null {
  const monthly = (value: number | null) =>
    value ? Math.round(value / 12) : null;

  const from = monthly(match.salary_from);
  const to = monthly(match.salary_to);
  if (!from && !to) return null;

  const n = (value: number) => value.toLocaleString("en-US");
  const currency = match.salary_currency ? ` ${match.salary_currency}` : "";

  if (from && to) {
    return from === to
      ? `${n(from)}${currency} / mo`
      : `${n(from)}–${n(to)}${currency} / mo`;
  }
  if (from) return `from ${n(from)}${currency} / mo`;
  return `up to ${n(to as number)}${currency} / mo`;
}

function Chip({
  tone,
  children,
}: {
  tone: "positive" | "attention";
  children: string;
}) {
  const styles =
    tone === "positive"
      ? "bg-positive-soft text-positive"
      : "bg-attention-soft text-attention";
  const Icon = tone === "positive" ? Check : Minus;

  return (
    <li
      className={`inline-flex max-w-full items-start gap-1.5 rounded-lg px-2.5 py-1 text-xs leading-relaxed ${styles}`}
    >
      <Icon className="mt-0.5 size-3 shrink-0" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

export default function MatchCard({ match, index }: Props) {
  const explanation = match.explanation;
  const salary = formatSalary(match);

  return (
    <article
      className="animate-fade-up rounded-2xl border border-line bg-raised p-5 shadow-card transition-colors duration-150 hover:border-line-strong"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-sunken px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted">
              {match.rank}
            </span>
            <h3 className="text-base font-semibold leading-snug text-ink">
              {match.title}
            </h3>
          </div>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {match.company_name && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" aria-hidden />
                {match.company_name}
              </span>
            )}
            {match.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden />
                {match.city}
              </span>
            )}
          </p>

          {salary && (
            <p className="mt-0.5 w-fit rounded-lg bg-sunken px-2 py-0.5 font-mono text-xs tabular-nums text-ink">
              {salary}
            </p>
          )}
        </div>

        {explanation && <ScoreRing score={explanation.match_score} />}
      </div>

      {explanation ? (
        <div className="mt-4 flex flex-col gap-3">
          {explanation.strengths.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {explanation.strengths.map((strength, i) => (
                <Chip key={i} tone="positive">
                  {strength}
                </Chip>
              ))}
            </ul>
          )}
          {explanation.gaps.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {explanation.gaps.map((gap, i) => (
                <Chip key={i} tone="attention">
                  {gap}
                </Chip>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Not scored yet.</p>
      )}

      {match.url && (
        <a
          href={match.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          View offer
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </article>
  );
}
