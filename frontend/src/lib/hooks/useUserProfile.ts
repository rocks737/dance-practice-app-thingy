"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string;
  bio: string | null;
  dance_goals: string | null;
  birth_date: string | null;
  profile_visible: boolean;
  primary_role: string;
  wsdc_level: string | null;
  competitiveness_level: number;
  account_status: string;
  created_at: string;
  updated_at: string;
}

export function useUserProfile(authUserId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!authUserId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setError(error);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [authUserId]);

  return { profile, loading, error };
}

