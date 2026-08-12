"use client";
import { AlertCircle, ArrowLeft, Check, Loader2, RotateCw } from "lucide-react";
import { PipelineStage } from "@/lib/types";
import { StageError } from "@/lib/usePipeline";
import Button from "../ui/Button";

interface Props {
  current: PipelineStage | null;
  completed: PipelineStage[];
  error: StageError | null;
  onRetry: () => void;
  onBack: () => void;
}

const ORDER: PipelineStage[] = ["fetch", "index", "rank", "explain"];

const LABELS: Record<PipelineStage, { title: string; note?: string }> = {
  fetch: { title: "Fetching offers" },
  index: { title: "Indexing offers for search" },
  rank: { title: "Ranking them against your CV" },
  // Silence during the LLM call reads as a hang, so say what to expect.
  explain: {
    title: "Explaining each match",
    note: "This can take up to a minute",
  },
};

export default function StepRunning({
  current,
  completed,
  error,
  onRetry,
  onBack,
}: Props) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-raised p-5 shadow-card sm:p-6">
      <ol className="flex flex-col gap-1" aria-live="polite">
        {ORDER.map((stage) => {
          const done = completed.includes(stage);
          const active = current === stage;
          // Read the message here so it stays narrowed to a string below.
          const failure = error && error.stage === stage ? error.message : null;
          const failed = failure !== null;
          const { title, note } = LABELS[stage];

          return (
            <li key={stage} className="flex items-start gap-3 py-2">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                {failed ? (
                  <AlertCircle className="size-5 text-danger" aria-hidden />
                ) : done ? (
                  <Check className="size-4 text-positive" aria-hidden />
                ) : active ? (
                  <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-line-strong" aria-hidden />
                )}
              </span>

              <span className="flex flex-col gap-0.5">
                <span
                  className={`text-sm ${
                    failed
                      ? "font-medium text-danger"
                      : active
                        ? "font-medium text-ink"
                        : done
                          ? "text-ink"
                          : "text-muted"
                  }`}
                >
                  {title}
                </span>

                {failure ? (
                  <span className="text-xs text-danger">{failure}</span>
                ) : (
                  active && note && <span className="text-xs text-muted">{note}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="flex items-center justify-between border-t border-line pt-5">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to filters
          </Button>
          <Button onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
