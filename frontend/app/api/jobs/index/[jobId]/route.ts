import { callBackend } from "@/lib/server/backend";
import { jobIdOrError } from "@/lib/server/guards";

export async function GET(_request: Request, ctx: RouteContext<"/api/jobs/index/[jobId]">) {
    const { jobId } = await ctx.params;
    const invalid = jobIdOrError(jobId);
    if (invalid) return invalid;

    return callBackend(`/jobs/index/${jobId}`);
}
