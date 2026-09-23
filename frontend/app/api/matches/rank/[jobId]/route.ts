import { callBackend } from "@/lib/server/backend";
import { jobIdOrError } from "@/lib/server/guards";

export async function GET(_request: Request, ctx: RouteContext<"/api/matches/rank/[jobId]">) {
    const { jobId } = await ctx.params;
    const invalid = jobIdOrError(jobId);
    if (invalid) return invalid;

    return callBackend(`/matches/rank/${jobId}`);
}
