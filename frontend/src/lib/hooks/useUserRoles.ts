"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export interface UserRoles {
  isAdmin: boolean;
  isInstructor: boolean;
  isOrganizer: boolean;
  isDancer: boolean;
  roles: string[];
}

export function useUserRoles(userId?: string) {
  const [roles, setRoles] = useState<UserRoles>({
    isAdmin: false,
    isInstructor: false,
    isOrganizer: false,
    isDancer: false,
    roles: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user roles:", error);
        setLoading(false);
        return;
      }

      const userRoles = data?.map((r) => r.role) || [];

      setRoles({
        isAdmin: userRoles.includes("ADMIN"),
        isInstructor: userRoles.includes("INSTRUCTOR"),
        isOrganizer: userRoles.includes("ORGANIZER"),
        isDancer: userRoles.includes("DANCER"),
        roles: userRoles,
      });
      setLoading(false);
    };

    fetchRoles();
  }, [userId]);

  return { ...roles, loading };
}
