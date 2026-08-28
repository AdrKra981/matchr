import { requireSameOrigin } from "@/lib/server/guards";
import { clearSessionCookie } from "@/lib/server/session";

/**
 * The backend issues stateless JWTs with no revocation list, so signing out is
 * exactly this: drop the cookie. The token stays valid until it expires, but it
 * only ever existed on the server and is now unreachable from anywhere.
 */
export async function POST(request: Request) {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;

    await clearSessionCookie();
    return new Response(null, { status: 204 });
}
