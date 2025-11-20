import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/AppSidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-scroll" style={{ scrollbarGutter: "stable both-edges" }}>
        <div className="w-full p-8 flex justify-center">
          <div className="w-full max-w-5xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
