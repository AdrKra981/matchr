"use client";
import { useState } from "react";
import { getMatches } from "@/lib/api";
import { Match } from "@/lib/types";
import CvUpload from "@/components/CvUpload";
import PipelineControls from "@/components/PipelineControls";
import MatchList from "@/components/MatchList";

export default function Home() {
  const [hasCv, setHasCv] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  const loadMatches = async () => {
    setMatches(await getMatches());
  };

  return (
    <main className="max-w-3xl mx-auto p-8 flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Matchr</h1>
        <p className="text-zinc-600">Dopasuj oferty pracy do swojego CV.</p>
      </header>

      <section className="flex flex-col gap-4">
        <CvUpload onUploaded={() => setHasCv(true)} />
        <PipelineControls disabled={!hasCv} onFinished={loadMatches} />
      </section>

      <MatchList matches={matches} />
    </main>
  );
}