/**
 * Turns a caught unknown into something showable.
 *
 * Lives here rather than beside the pipeline hook because the auth forms need
 * it too, and a login form has no business importing from a job-ranking module.
 */
export function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : "Something went wrong.";
}
