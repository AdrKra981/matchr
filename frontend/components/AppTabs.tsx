"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, MessageSquareText } from "lucide-react";

const TABS = [
  { href: "/", label: "Matches", icon: ListChecks },
  { href: "/agent", label: "Assistant", icon: MessageSquareText },
];

/**
 * Switches between the two pages. These are links rather than an ARIA tablist:
 * each one is its own URL, and a tablist promises in-page panels.
 */
export default function AppTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="inline-flex w-fit rounded-xl border border-line bg-sunken p-1"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-8 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors duration-150
              ${active ? "bg-raised font-medium text-ink shadow-card" : "text-muted hover:text-ink"}`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
