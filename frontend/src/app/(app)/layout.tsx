import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { FlashMessage } from "@/components/FlashMessage";

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
      <Suspense fallback={null}>
        <FlashMessage />
      </Suspense>
      <ErrorBoundary>
        <AppSidebar user={user} />
      </ErrorBoundary>
      <main
        className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0"
        style={{ scrollbarGutter: "stable both-edges" }}
      >
        <div className="w-full p-4 sm:p-6 lg:p-8 flex justify-center">
          <div className="w-full max-w-5xl min-w-0">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
