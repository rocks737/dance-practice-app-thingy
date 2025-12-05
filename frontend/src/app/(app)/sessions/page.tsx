import { CalendarRange } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionsExplorer } from "@/components/sessions/SessionsExplorer";

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-full bg-primary/10 p-2 sm:p-3 text-primary flex-shrink-0">
            <CalendarRange className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sessions</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Search and manage practice sessions.
            </p>
          </div>
        </div>
      </div>

      <SessionsExplorer authUserId={user.id} />
    </div>
  );
}
