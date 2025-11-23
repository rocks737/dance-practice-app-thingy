"use client";

import { useEffect, useState, useCallback } from "react";
import { getProfileByAuthUserId } from "@/lib/profiles/api";
import type { UserProfile } from "@/lib/profiles/types";

export function useUserProfile(authUserId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!authUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileData = await getProfileByAuthUserId(authUserId);
      setProfile(profileData);
    } catch (fetchError) {
      console.error("Error fetching user profile:", fetchError);
      setError(fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
    } finally {
      setLoading(false);
    }
  }, [authUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

