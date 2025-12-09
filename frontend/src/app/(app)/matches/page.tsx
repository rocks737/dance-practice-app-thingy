import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileIdByAuthUserId } from "@/lib/profiles/api";
import { MatchesBrowser } from "@/components/matches/MatchesBrowser";

async function checkUserHasSchedule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("schedule_preferences")
    .select("id")
    .eq("user_id", profileId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error checking schedule:", error);
    return false;
  }

  return data !== null;
}

export default async function MatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileId = await fetchProfileIdByAuthUserId(supabase, user.id);
  if (!profileId) {
    redirect("/profile?message=Please complete your profile first");
  }

  // Check if user has a schedule preference
  const hasSchedule = await checkUserHasSchedule(supabase, profileId);
  if (!hasSchedule) {
    redirect("/schedule?message=Please set up your schedule first to find matches");
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-full bg-primary/10 p-2 sm:p-3 text-primary flex-shrink-0">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Matches</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Find practice partners based on your availability and preferences.
            </p>
          </div>
        </div>
      </div>

      <MatchesBrowser profileId={profileId} />
    </div>
  );
}
