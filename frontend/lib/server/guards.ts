import { detail } from "./backend";

/**
 * Cookie auth means the browser attaches our session to *any* request it
 * makes to this origin, including ones a hostile page triggered. SameSite=Lax
 * blocks the classic cross-site form POST; this is the second lock.
 *
 * Browsers always send Origin on POST, so a missing one is never a genuine
 * same-origin browser request — reject rather than guess.
 */
export function requireSameOrigin(request: Request): Response | null {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (!origin || !host) return detail("Cross-origin request rejected.", 403);

    try {
        if (new URL(origin).host !== host) {
            return detail("Cross-origin request rejected.", 403);
        }
    } catch {
        return detail("Cross-origin request rejected.", 403);
    }
    return null;
}

/**
 * Rebuilds the query string from an allowlist.
 *
 * Copying the incoming string wholesale would let a caller smuggle any
 * parameter a backend endpoint happens to accept, now or after someone adds
 * one. Only these names travel.
 */
export function pickParams(
    request: Request,
    allowed: readonly string[],
): string {
    const incoming = new URL(request.url).searchParams;
    const out = new URLSearchParams();
    for (const key of allowed) {
        const value = incoming.get(key);
        if (value !== null && value !== "") out.set(key, value);
    }
    const query = out.toString();
    return query ? `?${query}` : "";
}

export interface Credentials {
    email: string;
    password: string;
}

/** Reads and shape-checks a credentials body, so junk never reaches the backend. */
export async function readCredentials(
    request: Request,
): Promise<Credentials | null> {
    try {
        const body = await request.json();
        const { email, password } = body ?? {};
        if (typeof email !== "string" || typeof password !== "string") return null;
        if (!email.trim() || !password) return null;
        return { email: email.trim(), password };
    } catch {
        return null;
    }
}
