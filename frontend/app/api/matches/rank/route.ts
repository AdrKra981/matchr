import { callBackend } from "@/lib/server/backend";
import { pickParams, requireSameOrigin } from "@/lib/server/guards";

const RANK_PARAMS = ["top_k", "what", "city", "min_salary"] as const;

export async function POST(request: Request) {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;

    return callBackend(`/matches/rank${pickParams(request, RANK_PARAMS)}`, {
        method: "POST",
    });
}
