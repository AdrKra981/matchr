"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { login } from "@/lib/auth";
import { messageOf } from "@/lib/errors";
import Button from "../ui/Button";
import Field from "../ui/Field";
import FormError from "./FormError";

interface Props {
    /** Already constrained to a same-site path by safeNextPath. */
    next: string;
    expired: boolean;
}

export default function LoginForm({ next, expired }: Props) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login({ email, password });
            // A push would leave the login page in the back stack, where the
            // proxy would only bounce them forward again.
            router.replace(next);
            // The session cookie is new; drop the router cache so the next
            // render is fetched as the signed-in user.
            router.refresh();
        } catch (err) {
            setError(messageOf(err));
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {expired && !error && (
                <p className="rounded-xl bg-attention-soft px-3 py-2.5 text-sm text-attention">
                    Your session expired. Please sign in again.
                </p>
            )}
            {error && <FormError message={error} />}

            <Field
                label="Email"
                type="email"
                autoComplete="email"
                icon={Mail}
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                required
            />

            <Field
                label="Password"
                type="password"
                autoComplete="current-password"
                icon={Lock}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                required
            />

            <Button
                type="submit"
                loading={submitting}
                disabled={!email.trim() || !password}
                className="mt-1 w-full"
            >
                Sign in
                {!submitting && <ArrowRight className="size-4" aria-hidden />}
            </Button>
        </form>
    );
}
