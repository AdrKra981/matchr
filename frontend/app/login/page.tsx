import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/redirect";

export const metadata: Metadata = { title: "Sign in — Matchr" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
    const { next, expired } = await searchParams;

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Sign in to pick up where your matches left off."
            footer={{
                prompt: "No account yet?",
                linkLabel: "Create one",
                href: "/register",
            }}
        >
            <LoginForm
                next={safeNextPath(typeof next === "string" ? next : null)}
                expired={expired === "1"}
            />
        </AuthShell>
    );
}
