import { API_BASE } from "./config";
import {
    AgentMessage,
    CvUploadResult,
    JobState,
    Match,
    QueuedJob,
    RankParams,
    User,
} from "./types";

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

/** Makes the call and turns every failure into an Error worth showing. */
async function send(
    path: string,
    init?: RequestInit,
    { bounceOn401 = true }: RequestOptions = {},
): Promise<Response> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...init,
            // Same-origin now, so the session cookie rides along on its own —
            // being explicit keeps that a decision rather than a default.
            credentials: "same-origin",
        });
    } catch (e) {
        // A deliberate cancel is not an outage; let the caller see it as-is.
        if (init?.signal?.aborted) throw e;
        // fetch only rejects on network-level failure, so this is the
        // "the app itself is unreachable" case rather than a bad response.
        throw new Error("Cannot reach the server. Is the backend running?");
    }

    if (res.status === 401 && bounceOn401) {
        bounceToLogin();
        throw new Error("Your session has expired. Please sign in again.");
    }
    if (!res.ok) throw new Error(await errorMessage(res));
    return res;
}

async function request<T>(
    path: string,
    init?: RequestInit,
    options?: RequestOptions,
): Promise<T> {
    const res = await send(path, init, options);
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

const POLL_INTERVAL_MS = 1500;
/** Well past a slow rerank or a full reindex; after this we stop asking. */
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Asks `statusPath/{jobId}` until the background job settles.
 *
 * Resolves with the job's result, or rejects once it has failed, been
 * stopped, or is still going after POLL_TIMEOUT_MS. Retries the backend
 * schedules show up as "scheduled"/"queued" and are simply waited out.
 */
async function waitForJob<T>(statusPath: string, jobId: string, what: string): Promise<T> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    for (;;) {
        const { status, result } = await request<JobState<T>>(
            `${statusPath}/${encodeURIComponent(jobId)}`,
        );
        if (status === "finished") return result as T;
        if (status === "failed") throw new Error(`${what} failed on the server.`);
        if (status === "stopped" || status === "canceled") {
            throw new Error(`${what} was cancelled on the server.`);
        }
        if (Date.now() > deadline) throw new Error(`${what} is taking too long.`);
        await sleep(POLL_INTERVAL_MS);
    }
}

/** Queues indexing and waits for it, so ranking never searches a half-built index. */
export async function indexJobs(): Promise<unknown> {
    const { job_id } = await post<QueuedJob>("/jobs/index");
    return waitForJob("/jobs/index", job_id, "Indexing");
}

/** Queues ranking and waits for it; explain reads the matches it saves. */
export async function rankMatches({
    topK = 10,
    what,
    city,
    minSalary,
}: RankParams = {}): Promise<unknown> {
    const params = new URLSearchParams({ top_k: String(topK) });
    if (what) params.append("what", what);
    if (city) params.append("city", city);
    // The backend parameter is `min_salary`; sending `minSalary` here meant
    // FastAPI silently dropped it and the filter never applied.
    if (minSalary !== undefined) params.append("min_salary", String(minSalary));
    const { job_id } = await post<QueuedJob>(`/matches/rank?${params}`);
    return waitForJob("/matches/rank", job_id, "Ranking");
}

export const explainMatches = () => post("/matches/explain");

export const getMatches = () => request<Match[]>("/matches");

export const getCurrentUser = () => request<User>("/auth/me");

export const getAgentHistory = () => request<AgentMessage[]>("/agent/history");

/**
 * Asks the agent a question and passes its reply along as it is written.
 *
 * Resolves once the reply is complete. When `signal` fires it rejects with the
 * abort error untouched, so the caller can tell a stop from a failure.
 */
export async function streamAgent(
    question: string,
    onText: (text: string) => void,
    signal?: AbortSignal,
): Promise<void> {
    const res = await send("/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: question }),
        signal,
    });
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
        for (; ;) {
            const { done, value } = await reader.read();
            if (done) break;
            // stream: true holds back a character whose bytes were split
            // across two chunks, instead of printing it as garbage.
            const text = decoder.decode(value, { stream: true });
            if (text) onText(text);
        }
    } catch (e) {
        if (signal?.aborted) throw e;
        throw new Error("The connection dropped before the reply finished.");
    }

    const tail = decoder.decode();
    if (tail) onText(tail);
}

