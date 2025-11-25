import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950">
      <ErrorBoundary>
        <AppSidebar user={user} />
      </ErrorBoundary>
      <main
        className="flex-1 overflow-y-scroll w-full"
        style={{ scrollbarGutter: "stable both-edges" }}
      >
        <div className="w-full p-8 flex justify-center">
          <div className="w-full max-w-5xl min-w-0">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
