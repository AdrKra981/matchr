import { callBackendAnonymous, detail } from "@/lib/server/backend";
import { readCredentials, requireSameOrigin } from "@/lib/server/guards";
import { writeSessionCookie } from "@/lib/server/session";

export async function POST(request: Request) {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;

    const credentials = await readCredentials(request);
    if (!credentials) return detail("Email and password are required.", 400);

    const res = await callBackendAnonymous("/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credentials),
    });
    // The backend already answers a wrong email and a wrong password
    // identically, so passing its message straight through leaks nothing about
    // which addresses are registered.
    if (!res.ok) return res;

    const { access_token: token } = await res.json();
    if (typeof token !== "string") return detail("Malformed response from the server.", 502);

    await writeSessionCookie(token);
    // The token stops here. The client only learns that it worked.
    return Response.json({ ok: true });
}
