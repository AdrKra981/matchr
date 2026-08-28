"use client";
import { useCallback, useState } from "react";
import { explainMatches, fetchJobs, indexJobs, rankMatches } from "./api";
import { messageOf } from "./errors";
import { FilterState, PipelineStage } from "./types";

export interface StageError {
    stage: PipelineStage;
    message: string;
}

/**
 * Runs the four backend calls in order, exposing which stage is in flight so
 * the UI can show real progress rather than one opaque spinner.
 *
 * Nothing is retried automatically — a failed stage stops the run and waits
 * for the user, because every stage costs either an API quota or LLM tokens.
 */
export function usePipeline() {
    const [current, setCurrent] = useState<PipelineStage | null>(null);
    const [completed, setCompleted] = useState<PipelineStage[]>([]);
    const [error, setError] = useState<StageError | null>(null);

    const run = useCallback(async (filters: FilterState): Promise<boolean> => {
        setError(null);
        setCompleted([]);

        const steps: [PipelineStage, () => Promise<unknown>][] = [
            ["fetch", () => fetchJobs(filters.what)],
            ["index", () => indexJobs()],
            [
                "rank",
                () =>
                    rankMatches({
                        topK: filters.topK,
                        what: filters.what,
                        city: filters.city.trim() || undefined,
                        // Offers are stored as annual salary; the form asks per month.
                        minSalary: filters.minSalary.trim()
                            ? Number(filters.minSalary) * 12
                            : undefined,
                    }),
            ],
            ["explain", () => explainMatches()],
        ];

        for (const [stage, call] of steps) {
            setCurrent(stage);
            try {
                await call();
            } catch (e) {
                setError({ stage, message: messageOf(e) });
                setCurrent(null);
                return false;
            }
            setCompleted((prev) => [...prev, stage]);
        }

        setCurrent(null);
        return true;
    }, []);

    return { current, completed, error, run };
}
