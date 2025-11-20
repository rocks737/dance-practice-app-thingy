import useSWR from "swr";
import { fetchSchedulePreferences } from "@/lib/schedule/api";
import type { SchedulePreference } from "@/lib/schedule/types";

interface UseSchedulePreferencesResult {
  preferences: SchedulePreference[];
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refresh: () => Promise<SchedulePreference[] | undefined>;
}

export function useSchedulePreferences(userId?: string): UseSchedulePreferencesResult {
  const key = userId ? ["schedule-preferences", userId] : null;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<SchedulePreference[]>(key, () => fetchSchedulePreferences(userId!));

  return {
    preferences: data ?? [],
    loading: Boolean(isLoading && !data),
    refreshing: isValidating,
    error: (error as Error) ?? null,
    refresh: () => mutate(),
  };
}


