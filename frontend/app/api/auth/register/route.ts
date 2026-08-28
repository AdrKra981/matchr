import { callBackendAnonymous, detail } from "@/lib/server/backend";
import { readCredentials, requireSameOrigin } from "@/lib/server/guards";
import { writeSessionCookie } from "@/lib/server/session";

/** Mirrors nothing on the backend, which has no password rule of its own yet. */
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;

    const credentials = await readCredentials(request);
    if (!credentials) return detail("Email and password are required.", 400);
    if (credentials.password.length < MIN_PASSWORD_LENGTH) {
        return detail(
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
            400,
        );
    }

    const created = await callBackendAnonymous("/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credentials),
    });
    // 409 (email taken) and 422 (invalid address) both belong to the user.
    if (!created.ok) return created;

    // Registering returns the user but no token. Log them straight in rather
    // than making them retype the credentials they just chose.
    const session = await callBackendAnonymous("/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credentials),
    });
    if (!session.ok) return session;

    const { access_token: token } = await session.json();
    if (typeof token !== "string") return detail("Malformed response from the server.", 502);

    await writeSessionCookie(token);
    return Response.json({ ok: true }, { status: 201 });
}
