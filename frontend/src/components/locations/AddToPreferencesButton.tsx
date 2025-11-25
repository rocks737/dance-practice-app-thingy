"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AddToPreferencesButtonProps {
  locationId: string;
}

export function AddToPreferencesButton({ locationId }: AddToPreferencesButtonProps) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Please sign in to add locations to your preferences");
        setPending(false);
        return;
      }

      // Resolve profile
      const { data: profile, error: profileErr } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (profileErr || !profile?.id) {
        toast.error("Unable to load your profile");
        setPending(false);
        return;
      }

      const profileId = profile.id;

      // Find an existing preference or create a default one
      const { data: prefRows, error: prefErr } = await supabase
        .from("schedule_preferences")
        .select("id")
        .eq("user_id", profileId)
        .order("created_at", { ascending: true })
        .limit(1);
      if (prefErr) {
        toast.error("Unable to load your schedule preferences");
        setPending(false);
        return;
      }

      let preferenceId = prefRows?.[0]?.id as string | undefined;
      if (!preferenceId) {
        // Create a minimal default preference
        const { data: created, error: createErr } = await supabase
          .from("schedule_preferences")
          .insert({
            user_id: profileId,
            max_travel_distance_km: null,
            location_note: null,
            notes: "Created from Locations page",
          })
          .select("id")
          .single();
        if (createErr || !created?.id) {
          toast.error("Unable to create a schedule preference");
          setPending(false);
          return;
        }
        preferenceId = created.id;
      }

      // Link the location (ignore duplicates)
      const { error: linkErr } = await supabase
        .from("schedule_preference_locations")
        .insert(
          { preference_id: preferenceId, location_id: locationId },
          { onConflict: "preference_id,location_id" },
        );
      if (linkErr && !String(linkErr.message).includes("duplicate")) {
        toast.error("Unable to add location to preferences");
        setPending(false);
        return;
      }

      toast.success("Location added to your preferences");
    } catch (_e) {
      toast.error("Something went wrong");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={pending}>
      {pending ? "Adding..." : "Add to my preferences"}
    </Button>
  );
}
