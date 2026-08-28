import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/config";

/**
 * Renamed from `middleware.ts` in Next.js 16 — same file, same behaviour.
 *
 * Two jobs, both deliberately shallow:
 *
 *  1. Send signed-out visitors to /login before a protected page renders.
 *     This only checks that a cookie *exists*. Verifying the JWT here would
 *     mean a signature check on every navigation and every prefetch, and it
 *     would still not be the real gate — the route handlers under app/api and
 *     FastAPI itself both re-check the token against the actual data.
 *
 *  2. Attach the security headers, including a per-request CSP nonce.
 */

const PUBLIC_ROUTES = ["/login", "/register"];

export function proxy(request: NextRequest) {
    const nonce = btoa(crypto.randomUUID());
    const csp = contentSecurityPolicy(nonce);

    const destination = authRedirect(request);
    if (destination) return harden(NextResponse.redirect(destination), csp);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    // Next reads the policy back off the request to stamp the nonce onto its
    // own script tags. Without this the app's own bundles get blocked.
    requestHeaders.set("Content-Security-Policy", csp);

    return harden(NextResponse.next({ request: { headers: requestHeaders } }), csp);
}

/** Returns where this request should go instead, or null to let it through. */
function authRedirect(request: NextRequest): URL | null {
    const { pathname } = request.nextUrl;
    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const hasSession = request.cookies.has(SESSION_COOKIE);

    if (!hasSession && !isPublic) {
        const login = new URL("/login", request.nextUrl);
        // So signing in returns them to the page they actually wanted.
        if (pathname !== "/") login.searchParams.set("next", pathname);
        return login;
    }

    // Already signed in: the login and register pages have nothing to offer.
    if (hasSession && isPublic) return new URL("/", request.nextUrl);

    return null;
}

function contentSecurityPolicy(nonce: string): string {
    const isDev = process.env.NODE_ENV === "development";

    return [
        "default-src 'self'",
        // 'strict-dynamic' lets the nonced bundle load its own chunks while
        // still refusing anything injected into the document.
        // React needs eval in dev to rebuild server stacks; production doesn't.
        `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} 'strict-dynamic'`,
        // Not nonced on purpose. CSP3 ignores 'unsafe-inline' whenever a nonce
        // is present, and MatchCard and ScoreRing both set React inline styles,
        // which style-src covers. Scripts are the XSS vector worth locking
        // down; a stylesheet cannot exfiltrate a session on its own.
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data:",
        "font-src 'self'",
        // Everything now goes through same-origin /api, so an injected script
        // has nowhere to send what it reads.
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join("; ");
}

function harden(response: NextResponse, csp: string): NextResponse {
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
}

export const config = {
    matcher: [
        /*
         * Everything except:
         *  - /api      — route handlers authenticate themselves, and a redirect
         *                to an HTML login page would be a useless API response
         *  - static assets and the favicon, which need no policy
         */
        {
            source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
            missing: [{ type: "header", key: "next-router-prefetch" }],
        },
    ],
};
