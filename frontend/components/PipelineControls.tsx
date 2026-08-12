"use client";
import { useState } from "react";
import { fetchJobs, indexJobs, rankMatches, explainMatches } from "@/lib/api";

interface Props {
    onFinished: () => void;   // po zakończeniu rodzic pobiera ranking
    disabled?: boolean;       // np. dopóki nie ma CV
}

export default function PipelineControls({ onFinished, disabled }: Props) {
    const [what, setWhat] = useState("frontend developer");
    const [step, setStep] = useState("");
    const [running, setRunning] = useState(false);

    const runPipeline = async () => {
        setRunning(true);
        try {
            setStep("Pobieram oferty…");
            await fetchJobs(what);
            setStep("Indeksuję…");
            await indexJobs();
            setStep("Rankuję…");
            await rankMatches(10, what);
            setStep("Oceniam dopasowania (to chwilę potrwa)…");
            await explainMatches();
            setStep("Gotowe");
            onFinished();
        } catch {
            setStep("Błąd podczas analizy");
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <input value={what} onChange={(e) => setWhat(e.target.value)}
                placeholder="Stanowisko (np. frontend developer)"
                className="border rounded-lg px-3 py-2" />
            <button disabled={disabled || running} onClick={runPipeline}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg">
                {running ? "Analizuję…" : "Analizuj oferty"}
            </button>
            {step && <p className="text-sm text-zinc-600">{step}</p>}
        </div>
    );
}