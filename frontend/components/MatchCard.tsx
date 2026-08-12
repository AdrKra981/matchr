import { Match } from "@/lib/types";

interface Props {
    match: Match;
}

function formatSalary(m: Match): string | null {
    if (!m.salary_from && !m.salary_to) return null;
    const perMonth = (v: number | null) =>
        v ? Math.round(v / 12).toLocaleString("pl-PL") : "?";
    return `${perMonth(m.salary_from)}–${perMonth(m.salary_to)} ${m.salary_currency ?? ""}/mies.`;
}

export default function MatchCard({ match }: Props) {
    const exp = match.explanation;
    const salary = formatSalary(match);

    return (
        <div className="border rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-sm text-zinc-500">#{match.rank}</span>
                    <h3 className="text-lg font-semibold">{match.title}</h3>
                    <p className="text-sm text-zinc-600">{match.company_name} · {match.city}</p>
                </div>
                {exp && (
                    <div className="text-right">
                        <div className="text-2xl font-bold">{exp.match_score}%</div>
                        <div className="text-xs text-zinc-400">dopasowanie</div>
                    </div>
                )}
            </div>

            {salary && <p className="text-sm text-zinc-700">{salary}</p>}

            {exp ? (
                <div className="flex flex-col gap-2 mt-2">
                    {exp.strengths.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-green-700">Mocne strony</p>
                            <ul className="list-disc list-inside text-sm text-zinc-700">
                                {exp.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                    {exp.gaps.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-red-700">Braki</p>
                            <ul className="list-disc list-inside text-sm text-zinc-700">
                                {exp.gaps.map((g, i) => <li key={i}>{g}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-zinc-400">Brak oceny — uruchom analizę</p>
            )}

            {match.url && (
                <a href={match.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1">
                    Zobacz ofertę →
                </a>
            )}
        </div>
    );
}