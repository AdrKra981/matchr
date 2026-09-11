import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AgentChat from "@/components/agent/AgentChat";
import { currentUser } from "@/lib/server/user";

export const metadata: Metadata = { title: "Assistant — Matchr" };

export default async function AgentPage() {
  // Same gate as the home page: the proxy only saw that a cookie exists.
  const user = await currentUser();
  if (!user) redirect("/login?expired=1&next=/agent");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 pt-10 sm:pt-14">
      <AppHeader email={user.email} />
      <AgentChat />
    </main>
  );
}
