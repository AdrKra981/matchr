import type { User } from "../types";
import { callBackend } from "./backend";

/**
 * Resolves the signed-in user during a server render.
 *
 * The proxy only checked that a cookie exists. This is the check that counts:
 * FastAPI verifies the token's signature and expiry, so a forged or stale
 * cookie ends up here as null rather than as a rendered page.
 */
export async function currentUser(): Promise<User | null> {
    const res = await callBackend("/auth/me");
    if (!res.ok) return null;

    try {
        return (await res.json()) as User;
    } catch {
        return null;
    }
}
