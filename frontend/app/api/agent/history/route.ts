import { callBackend } from "@/lib/server/backend";

export function GET() {
    // Scoped to the token's own user on the backend, like /matches.
    return callBackend("/agent/history");
}
