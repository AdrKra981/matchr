import { callBackend, detail } from "@/lib/server/backend";
import { requireSameOrigin } from "@/lib/server/guards";

/** Plenty for a real question, and a ceiling on what a single prompt can cost. */
const MAX_QUERY_CHARS = 2000;

export async function POST(request: Request) {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;

    let query: unknown;
    try {
        ({ query } = await request.json());
    } catch {
        return detail("Expected a JSON body.", 400);
    }
    if (typeof query !== "string" || !query.trim()) {
        return detail("Enter a question for the assistant.", 400);
    }
    if (query.length > MAX_QUERY_CHARS) {
        return detail(`Keep questions under ${MAX_QUERY_CHARS} characters.`, 413);
    }

    // Only the question travels. The step budget stays the backend's call, so
    // a caller can't ask for a longer — and pricier — run.
    return callBackend(
        "/agent/",
        {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ query: query.trim() }),
            // Stopping in the browser closes the upstream request as well, so
            // the backend can give up instead of finishing a reply nobody reads.
            signal: request.signal,
        },
        { stream: true },
    );
}
