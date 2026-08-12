"use client";
import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { getMatches } from "@/lib/api";
import { messageOf, usePipeline } from "@/lib/usePipeline";
import { CvSummary, FilterState, Match } from "@/lib/types";
import Stepper from "@/components/Stepper";
import StepCv from "@/components/steps/StepCv";
import StepFilters from "@/components/steps/StepFilters";
import StepRunning from "@/components/steps/StepRunning";
import StepResults from "@/components/steps/StepResults";

type Step = "cv" | "filters" | "running" | "results";

// "Running" is the tail of the filters step from the user's point of view,
// so it shares the third dot with the results it produces.
const STEP_INDEX: Record<Step, number> = {
  cv: 0,
  filters: 1,
  running: 2,
  results: 2,
};

const DEFAULT_FILTERS: FilterState = {
  what: "frontend developer",
  city: "",
  minSalary: "",
  topK: 10,
};

export default function Home() {
  const [step, setStep] = useState<Step>("cv");
  const [cv, setCv] = useState<CvSummary | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // null while the request is in flight, so results can show skeletons.
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const pipeline = usePipeline();

  const loadResults = useCallback(async () => {
    setMatches(null);
    setResultsError(null);
    try {
      setMatches(await getMatches());
    } catch (e) {
      setResultsError(messageOf(e));
    }
  }, []);

  const run = useCallback(async () => {
    setStep("running");
    // On failure we stay on the running step, which shows which stage broke.
    if (!(await pipeline.run(filters))) return;
    setStep("results");
    await loadResults();
  }, [filters, loadResults, pipeline]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:py-14">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-on">
            <Sparkles className="size-4.5" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Matchr</h1>
        </div>
        {step === "cv" && (
          <p className="text-sm text-muted">
            Upload your CV and find the job offers that actually fit it — with an
            explanation of why, and what you&rsquo;re missing.
          </p>
        )}
      </header>

      <Stepper current={STEP_INDEX[step]} />

      {step === "cv" && (
        <StepCv cv={cv} onUploaded={setCv} onContinue={() => setStep("filters")} />
      )}

      {step === "filters" && (
        <StepFilters
          filters={filters}
          onChange={setFilters}
          onBack={() => setStep("cv")}
          onSubmit={run}
        />
      )}

      {step === "running" && (
        <StepRunning
          current={pipeline.current}
          completed={pipeline.completed}
          error={pipeline.error}
          onRetry={run}
          onBack={() => setStep("filters")}
        />
      )}

      {step === "results" && (
        <StepResults
          matches={matches}
          error={resultsError}
          filters={filters}
          onRetry={loadResults}
          onChangeFilters={() => setStep("filters")}
          onNewCv={() => {
            setCv(null);
            setStep("cv");
          }}
        />
      )}
    </main>
  );
}
