import { callBackend } from "@/lib/server/backend";
import { requireSameOrigin } from "@/lib/server/guards";

export async function POST(request: Request) {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;

    return callBackend("/jobs/index", { method: "POST" });
}
