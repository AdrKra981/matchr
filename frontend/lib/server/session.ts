import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./config";

export async function readSessionToken(): Promise<string | undefined> {
    return (await cookies()).get(SESSION_COOKIE)?.value;
}

/**
 * The token goes into the cookie jar and nowhere else — it is never returned
 * in a response body, so the browser holds a session it cannot read.
 */
export async function writeSessionCookie(token: string): Promise<void> {
    (await cookies()).set(SESSION_COOKIE, token, {
        // Invisible to document.cookie, so an XSS payload cannot steal it.
        httpOnly: true,
        // Not attached to cross-site requests: the primary CSRF defence.
        sameSite: "lax",
        // Dev runs on plain http://localhost, where a Secure cookie is dropped.
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
}

export async function clearSessionCookie(): Promise<void> {
    (await cookies()).delete(SESSION_COOKIE);
}
