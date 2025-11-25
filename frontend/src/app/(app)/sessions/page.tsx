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
    <div className="space-y-6 min-w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <CalendarRange className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
            <p className="text-sm text-muted-foreground">
              Search, filter, and manage your practice sessions.
            </p>
          </div>
        </div>
      </div>

      <SessionsExplorer authUserId={user.id} />
    </div>
  );
}
