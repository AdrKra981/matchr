import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create an account — Matchr" };

export default function RegisterPage() {
    return (
        <AuthShell
            title="Create your account"
            subtitle="Your CV and your matches stay tied to it."
            footer={{
                prompt: "Already have an account?",
                linkLabel: "Sign in",
                href: "/login",
            }}
        >
            <RegisterForm />
        </AuthShell>
    );
}
