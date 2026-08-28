/**
 * Constrains a `?next=` value to a path on this site.
 *
 * Without this, /login?next=https://evil.example would hand an attacker a
 * link that authenticates the user and then drops them somewhere else — with
 * our own domain in the referrer to make it look legitimate.
 */
export function safeNextPath(raw: string | null | undefined): string {
    if (!raw) return "/";
    // Anything that isn't a single-slash relative path could resolve off-site:
    // "//evil.example" is protocol-relative, and "/\evil.example" is treated
    // the same way by several browsers.
    if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
        return "/";
    }
    return raw;
}
