import { API_BASE } from "./config";
import { CvUploadResult, Match, RankParams, User } from "./types";

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

/**
 * Sends the browser to the login page after the session has gone.
 *
 * The cookie is already cleared by the time a 401 reaches us, so a full
 * navigation is the honest move: it drops all in-memory state belonging to the
 * signed-out user rather than leaving a half-populated wizard on screen.
 */
function bounceToLogin(): void {
    if (typeof window === "undefined") return;
    const next = window.location.pathname;
    const params = new URLSearchParams({ expired: "1" });
    if (next !== "/") params.set("next", next);
    // A hard navigation rather than router.push, and deliberately so: this
    // tears down the React tree, which is the only way to guarantee the
    // previous user's uploaded CV and match list leave the page with them.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?${params}`;
}

interface RequestOptions {
    /** Login and register handle their own 401s, in the form. */
    bounceOn401?: boolean;
}

async function request<T>(
    path: string,
    init?: RequestInit,
    { bounceOn401 = true }: RequestOptions = {},
): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...init,
            // Same-origin now, so the session cookie rides along on its own —
            // being explicit keeps that a decision rather than a default.
            credentials: "same-origin",
        });
    } catch {
        // fetch only rejects on network-level failure, so this is the
        // "the app itself is unreachable" case rather than a bad response.
        throw new Error("Cannot reach the server. Is the backend running?");
    }

    if (res.status === 401 && bounceOn401) {
        bounceToLogin();
        throw new Error("Your session has expired. Please sign in again.");
    }
    if (!res.ok) throw new Error(await errorMessage(res));
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

/** POSTs JSON to a route handler, which rejects bodies from other origins. */
export function postJson<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
): Promise<T> {
    return request<T>(
        path,
        {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        },
        options,
    );
}

export const post = <T>(path: string) => request<T>(path, { method: "POST" });

export function uploadCv(file: File): Promise<CvUploadResult> {
    const fd = new FormData();
    fd.append("file", file);
    return request<CvUploadResult>("/cv/upload", { method: "POST", body: fd });
}

export const fetchJobs = (what: string) =>
    post(`/jobs/fetch?what=${encodeURIComponent(what)}`);

export const indexJobs = () => post("/jobs/index");

export const rankMatches = ({ topK = 10, what, city, minSalary }: RankParams = {}) => {
    const params = new URLSearchParams({ top_k: String(topK) });
    if (what) params.append("what", what);
    if (city) params.append("city", city);
    // The backend parameter is `min_salary`; sending `minSalary` here meant
    // FastAPI silently dropped it and the filter never applied.
    if (minSalary !== undefined) params.append("min_salary", String(minSalary));
    return post(`/matches/rank?${params}`);
};

export const explainMatches = () => post("/matches/explain");

export const getMatches = () => request<Match[]>("/matches");

export const getCurrentUser = () => request<User>("/auth/me");
