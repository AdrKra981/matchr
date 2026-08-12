import { Match } from "@/lib/types";
import MatchCard from "./MatchCard";

interface Props {
    matches: Match[];
}

export default function MatchList({ matches }: Props) {
    if (matches.length === 0) {
        return <p className="text-zinc-500">Brak dopasowań — wgraj CV i uruchom analizę.</p>;
    }
    return (
        <div className="flex flex-col gap-4">
            {matches.map((m) => <MatchCard key={m.rank} match={m} />)}
        </div>
    );
}