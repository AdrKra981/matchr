import { post, postJson } from "./api";
import { Credentials } from "./types";

/**
 * None of these return a token — there isn't one to return. The route handlers
 * put the backend's JWT straight into an httpOnly cookie, so from the client's
 * side signing in is just a request that either succeeds or doesn't.
 *
 * A 401 here means "wrong password", not "session expired", so these opt out of
 * the automatic redirect and let the form show the message instead.
 */

export const login = (credentials: Credentials) =>
    postJson<{ ok: true }>("/auth/login", credentials, { bounceOn401: false });

export const register = (credentials: Credentials) =>
    postJson<{ ok: true }>("/auth/register", credentials, { bounceOn401: false });

export const logout = () => post<void>("/auth/logout");
