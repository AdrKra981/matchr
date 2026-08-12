import { API_URL } from "./config";
import { Match, RankParams } from "./types";

export async function uploadCv(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/cv/upload`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload CV nieudany");
    return res.json();
}

export const fetchJobs = (what: string) =>
    fetch(`${API_URL}/jobs/fetch?what=${encodeURIComponent(what)}`, { method: "POST" }).then(r => r.json());

export const indexJobs = () =>
    fetch(`${API_URL}/jobs/index`, { method: "POST" }).then(r => r.json());

export const rankMatches = ({ topK = 10, what, city, minSalary }: RankParams = {}) => {
    const params = new URLSearchParams({ top_k: String(topK) });
    if (what) params.append("what", what);
    if (city) params.append("city", city);
    if (minSalary !== undefined) params.append("minSalary", String(minSalary));
    return fetch(`${API_URL}/matches/rank?${params}`, { method: "POST" }).then(r => r.json());
};

export const explainMatches = () =>
    fetch(`${API_URL}/matches/explain`, { method: "POST" }).then(r => r.json());

export const getMatches = (): Promise<Match[]> =>
    fetch(`${API_URL}/matches`).then(r => r.json());