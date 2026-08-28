import { callBackend, detail } from "@/lib/server/backend";
import { requireSameOrigin } from "@/lib/server/guards";

/** The client checks this too, but only this check is the one that counts. */
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
    const blocked = requireSameOrigin(request);
    if (blocked) return blocked;

    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return detail("Expected a file upload.", 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) return detail("No file was uploaded.", 400);
    if (file.size === 0) return detail("That file is empty.", 400);
    if (file.size > MAX_BYTES) return detail("That file is larger than 10 MB.", 413);
    if (file.type && file.type !== "application/pdf") {
        return detail("Matchr reads PDF CVs only.", 415);
    }

    // Rebuilt rather than streamed through, so only the field the backend
    // expects survives — anything else in the multipart body is dropped.
    const forwarded = new FormData();
    forwarded.append("file", file, file.name);

    // Deliberately no content-type header: fetch derives it from the FormData,
    // including the multipart boundary. Setting it by hand corrupts the body.
    return callBackend("/cv/upload", { method: "POST", body: forwarded });
}
