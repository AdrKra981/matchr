import { AlertCircle } from "lucide-react";

/** Matches the error treatment the wizard steps already use. */
export default function FormError({ message }: { message: string }) {
    return (
        <p
            className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger"
            role="alert"
        >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {message}
        </p>
    );
}
