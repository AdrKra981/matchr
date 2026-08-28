import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
    title: string;
    subtitle: string;
    children: ReactNode;
    /** The "no account yet?" / "already have one?" line under the card. */
    footer: { prompt: string; linkLabel: string; href: string };
}

/** Shared frame for the login and register pages, so the two stay in step. */
export default function AuthShell({ title, subtitle, children, footer }: Props) {
    return (
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7 px-5 py-12">
            <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-on">
                    <Sparkles className="size-5" aria-hidden />
                </span>
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                    <p className="text-sm text-muted">{subtitle}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-line bg-raised p-6 shadow-card">
                {children}
            </div>

            <p className="text-center text-sm text-muted">
                {footer.prompt}{" "}
                <Link
                    href={footer.href}
                    className="font-medium text-accent underline-offset-4 hover:underline"
                >
                    {footer.linkLabel}
                </Link>
            </p>
        </main>
    );
}
