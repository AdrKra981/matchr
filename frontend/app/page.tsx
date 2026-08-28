import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Wizard from "@/components/Wizard";
import { currentUser } from "@/lib/server/user";

export default async function Home() {
  // The proxy already turned away anyone without a cookie. This is the check
  // that actually validates it, so a forged or expired token never renders the
  // app shell — it lands back on the login page instead.
  const user = await currentUser();
  if (!user) redirect("/login?expired=1");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:py-14">
      <AppHeader email={user.email} />
      <Wizard />
    </main>
  );
}
