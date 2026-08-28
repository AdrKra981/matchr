/**
 * Server-only configuration.
 *
 * Nothing here carries the NEXT_PUBLIC_ prefix, so none of it is inlined into
 * the browser bundle — the backend's address never reaches the client. Treat
 * everything under lib/server/ as server-only: importing it from a client
 * component would undo that.
 */

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/** Holds the backend's JWT. Never readable from JavaScript — see session.ts. */
export const SESSION_COOKIE = "matchr_session";

/**
 * Kept in step with ACCESS_TOKEN_EXPIRE_MINUTES in
 * backend/app/auth/security.py. If the two drift apart and the cookie outlives
 * the token, the user gets 401s where they should have got a clean redirect.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
