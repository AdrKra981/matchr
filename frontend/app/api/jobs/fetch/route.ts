import { callBackend } from "@/lib/server/backend";
import { pickParams, requireSameOrigin } from "@/lib/server/guards";

export async function POST(request: Request) {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;

    return callBackend(`/jobs/fetch${pickParams(request, ["what"])}`, {
        method: "POST",
    });
}
