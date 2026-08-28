"use client";
import { useCallback, useState } from "react";
import { getMatches } from "@/lib/api";
import { messageOf } from "@/lib/errors";
import { usePipeline } from "@/lib/usePipeline";
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

/**
 * The matching flow itself, unchanged by the move behind authentication — the
 * session travels as a cookie the browser attaches on its own, so none of these
 * steps know or care that a token exists.
 */
export default function Wizard() {
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
    <>
      {step === "cv" && (
        <p className="-mt-4 text-sm text-muted">
          Upload your CV and find the job offers that actually fit it — with an
          explanation of why, and what you&rsquo;re missing.
        </p>
      )}

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
    </>
  );
}
