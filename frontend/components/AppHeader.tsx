"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { logout } from "@/lib/auth";
import Button from "./ui/Button";

export default function AppHeader({ email }: { email: string }) {
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);

    const signOut = async () => {
        setSigningOut(true);
        try {
            await logout();
        } catch {
            // Navigate regardless. If the request genuinely failed the cookie
            // survives and the proxy will send them back to the app — better
            // than stranding them on a header that no longer responds.
        }
        router.replace("/login");
        router.refresh();
    };

    return (
        <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-on">
                    <Sparkles className="size-4.5" aria-hidden />
                </span>
                <h1 className="text-xl font-semibold tracking-tight">Matchr</h1>
            </div>

            <div className="flex min-w-0 items-center gap-2">
                <span
                    className="hidden max-w-[16ch] truncate text-sm text-muted sm:inline"
                    title={email}
                >
                    {email}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    loading={signingOut}
                >
                    {!signingOut && <LogOut className="size-4" aria-hidden />}
                    Sign out
                </Button>
            </div>
        </header>
    );
}
