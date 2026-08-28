import { callBackend } from "@/lib/server/backend";

export function GET() {
    // The backend scopes this to the token's own user, so there is nothing to
    // pass along — a caller cannot ask for someone else's matches.
    return callBackend("/matches");
}
