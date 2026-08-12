"use client";
import { AlertCircle, FileUp, RotateCw, SearchX, SlidersHorizontal } from "lucide-react";
import { FilterState, Match } from "@/lib/types";
import MatchCard from "../MatchCard";
import Button from "../ui/Button";

interface Props {
  /** null while the request is in flight. */
  matches: Match[] | null;
  error: string | null;
  filters: FilterState;
  onRetry: () => void;
  onChangeFilters: () => void;
  onNewCv: () => void;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse-soft rounded-2xl border border-line bg-raised p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-2/3 rounded bg-sunken" />
          <div className="h-3 w-1/3 rounded bg-sunken" />
        </div>
        <div className="size-14 rounded-full bg-sunken" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-24 rounded-full bg-sunken" />
        <div className="h-6 w-20 rounded-full bg-sunken" />
        <div className="h-6 w-28 rounded-full bg-sunken" />
      </div>
    </div>
  );
}

export default function StepResults({
  matches,
  error,
  filters,
  onRetry,
  onChangeFilters,
  onNewCv,
}: Props) {
  const summary = matches
    ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} for ${filters.what}`
    : "Loading matches…";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {summary}
          {matches && filters.city.trim() && (
            <span className="text-ink"> · {filters.city.trim()}</span>
          )}
        </p>

        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={onChangeFilters}>
            <SlidersHorizontal className="size-4" aria-hidden />
            Change filters
          </Button>
          <Button variant="ghost" size="sm" onClick={onNewCv}>
            <FileUp className="size-4" aria-hidden />
            New CV
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-raised p-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertCircle className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-ink">Could not load matches</p>
            <p className="text-sm text-muted">{error}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Try again
          </Button>
        </div>
      ) : matches === null ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-raised p-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-sunken text-muted">
            <SearchX className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-ink">No matches yet</p>
            <p className="max-w-sm text-sm text-muted">
              Nothing came back for these filters. Try a broader role, drop the
              city, or lower the minimum salary.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onChangeFilters}>
            <SlidersHorizontal className="size-4" aria-hidden />
            Change filters
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((match, i) => (
            <MatchCard key={match.rank} match={match} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
