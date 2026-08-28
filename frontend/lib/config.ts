/**
 * Every browser request now goes to this app's own origin. The backend's real
 * address lives in lib/server/config.ts and is never shipped to the client —
 * which is why there is no NEXT_PUBLIC_ variable here any more.
 */
export const API_BASE = "/api";
