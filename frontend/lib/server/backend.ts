import { BACKEND_URL } from "./config";
import { clearSessionCookie, readSessionToken } from "./session";

/** Preserved from the old client-side fetch, which said this on a dead backend. */
const UNREACHABLE = "Cannot reach the server. Is the backend running?";

/**
 * Errors go out in FastAPI's `{ detail }` shape, because lib/api.ts already
 * knows how to read it — proxying should be invisible to the client.
 */
export function detail(message: string, status: number): Response {
    return Response.json({ detail: message }, { status });
}

/**
 * Calls the backend on behalf of the signed-in user.
 *
 * This is the only place the JWT is read and the only place the Authorization
 * header is written. The browser never sees either, so there is no token in the
 * page for an injected script to find.
 */
export async function callBackend(
    path: string,
    init: RequestInit = {},
): Promise<Response> {
    const token = await readSessionToken();
    // Refuse locally rather than letting the backend answer an anonymous call.
    if (!token) return detail("Not signed in.", 401);
    return forward(path, init, token);
}

/** For /auth/login and /auth/register only — the two calls with no session yet. */
export function callBackendAnonymous(
    path: string,
    init: RequestInit = {},
): Promise<Response> {
    return forward(path, init, undefined);
}

async function forward(
    path: string,
    init: RequestInit,
    token: string | undefined,
): Promise<Response> {
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let res: Response;
    try {
        res = await fetch(`${BACKEND_URL}${path}`, {
            ...init,
            headers,
            cache: "no-store",
        });
    } catch {
        // fetch only rejects on network-level failure, so the backend is down.
        return detail(UNREACHABLE, 502);
    }

    // An expired or revoked token. Dropping the cookie now means the next
    // navigation is a clean redirect to /login instead of another 401.
    if (res.status === 401 && token) {
        try {
            await clearSessionCookie();
        } catch {
            // Next only permits cookie writes from route handlers and server
            // actions. Reaching here means a server component made the call,
            // where the page redirects to /login on the 401 anyway and the
            // proxy clears up on the next request.
        }
        return detail("Your session has expired. Please sign in again.", 401);
    }

    // Backend crashes can carry stack traces or connection strings; the user
    // gets a flat message and the detail stays in the backend's own logs.
    if (res.status >= 500) return detail("Something went wrong on the server.", 502);

    const body = await res.text();
    return new Response(body || null, {
        status: res.status,
        headers: {
            "content-type": res.headers.get("content-type") ?? "application/json",
        },
    });
}
