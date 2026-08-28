import { callBackend } from "@/lib/server/backend";

export function GET() {
    return callBackend("/auth/me");
}
