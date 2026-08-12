import { API_URL } from "./config";
import { CvUploadResult, Match, RankParams } from "./types";

/** FastAPI puts its error text in `detail`; fall back to the status code. */
async function errorMessage(res: Response): Promise<string> {
    try {
        const body = await res.json();
        if (typeof body?.detail === "string") return body.detail;
    } catch {
        // Body wasn't JSON — the status code is all we have.
    }
    return `Request failed (${res.status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, init);
    } catch {
        // fetch only rejects on network-level failure, so this is the
        // "backend isn't running" case rather than a bad response.
        throw new Error("Cannot reach the server. Is the backend running?");
    }
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json() as Promise<T>;
}

export function uploadCv(file: File): Promise<CvUploadResult> {
    const fd = new FormData();
    fd.append("file", file);
    return request<CvUploadResult>("/cv/upload", { method: "POST", body: fd });
}

export const fetchJobs = (what: string) =>
    request(`/jobs/fetch?what=${encodeURIComponent(what)}`, { method: "POST" });

export const indexJobs = () => request("/jobs/index", { method: "POST" });

export const rankMatches = ({ topK = 10, what, city, minSalary }: RankParams = {}) => {
    const params = new URLSearchParams({ top_k: String(topK) });
    if (what) params.append("what", what);
    if (city) params.append("city", city);
    // The backend parameter is `min_salary`; sending `minSalary` here meant
    // FastAPI silently dropped it and the filter never applied.
    if (minSalary !== undefined) params.append("min_salary", String(minSalary));
    return request(`/matches/rank?${params}`, { method: "POST" });
};

export const explainMatches = () => request("/matches/explain", { method: "POST" });

export const getMatches = () => request<Match[]>("/matches");
