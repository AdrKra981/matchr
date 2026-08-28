"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { register } from "@/lib/auth";
import { messageOf } from "@/lib/errors";
import Button from "../ui/Button";
import Field from "../ui/Field";
import FormError from "./FormError";

/** Kept in step with the check in app/api/auth/register/route.ts. */
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Shown only once the user has typed something, so the form doesn't open
    // by telling them what they've done wrong.
    const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
    const mismatch = confirm.length > 0 && confirm !== password;
    const complete =
        email.trim() && password.length >= MIN_PASSWORD_LENGTH && confirm === password;

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            // Registering signs the user in as well, so there is nowhere to go
            // but the app itself.
            await register({ email, password });
            router.replace("/");
            router.refresh();
        } catch (err) {
            setError(messageOf(err));
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
                autoComplete="new-password"
                icon={Lock}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                error={tooShort ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
                required
            />

            <Field
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                icon={Lock}
                value={confirm}
                onChange={setConfirm}
                placeholder="••••••••"
                error={mismatch ? "Passwords don't match." : undefined}
                required
            />

            <Button
                type="submit"
                loading={submitting}
                disabled={!complete}
                className="mt-1 w-full"
            >
                Create account
                {!submitting && <ArrowRight className="size-4" aria-hidden />}
            </Button>
        </form>
    );
}
