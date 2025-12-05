import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SchedulePlanner } from "@/components/schedule/SchedulePlanner";
import { fetchProfileIdByAuthUserId } from "@/lib/profiles/api";

export default async function SchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileId = await fetchProfileIdByAuthUserId(supabase, user.id);
  if (!profileId) {
    // No profile yet: prompt user to complete onboarding
    redirect("/profile?message=Please complete your profile first");
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-full bg-primary/10 p-2 sm:p-3 text-primary flex-shrink-0">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Schedule</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Set availability and preferences to find partners.
            </p>
          </div>
        </div>
      </div>

      <SchedulePlanner profileId={profileId} />
    </div>
  );
}
