/**
 * Integration test for schedule preference availability windows
 * Tests the full stack: React Hook Form → API → Supabase → Back to UI
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseUrl, supabaseAnonKey } from "./integration-utils";

describe("Schedule Preference Availability Windows - Integration", () => {
  let supabase: ReturnType<typeof createClient<Database>>;
  let testUserId: string;
  let testProfileId: string;
  let testPreferenceId: string;

  beforeAll(async () => {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Create a test auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: "testpassword123",
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    testUserId = authData.user.id;

    // Create a test user profile
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        auth_user_id: testUserId,
        email: authData.user.email!,
        first_name: "Test",
        last_name: "User",
        primary_role: 0,
        competitiveness_level: 3,
        account_status: 0,
        profile_visible: true,
      })
      .select()
      .single();

    if (profileError || !profileData) {
      throw new Error(`Failed to create test profile: ${profileError?.message}`);
    }

    testProfileId = profileData.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testPreferenceId) {
      await supabase
        .from("schedule_preferences")
        .delete()
        .eq("id", testPreferenceId);
    }

    if (testProfileId) {
      await supabase.from("user_profiles").delete().eq("id", testProfileId);
    }

    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it("should create a preference with recurring and one-time windows", async () => {
    // Create a schedule preference with both recurring and one-time windows
    const { data: preference, error: createError } = await supabase
      .from("schedule_preferences")
      .insert({
        user_id: testProfileId,
        notes: "Integration test preference",
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(preference).toBeDefined();
    testPreferenceId = preference!.id;

    // Add a recurring window (Monday 10-12)
    const { error: recurringError } = await supabase
      .from("schedule_preference_windows")
      .insert({
        preference_id: testPreferenceId,
        day_of_week: "MONDAY",
        start_time: "10:00:00",
        end_time: "12:00:00",
        recurring: true,
      });

    expect(recurringError).toBeNull();

    // Add a one-time window (Friday 18-20 on 2025-12-05)
    const { error: oneTimeError } = await supabase
      .from("schedule_preference_windows")
      .insert({
        preference_id: testPreferenceId,
        day_of_week: "FRIDAY",
        start_time: "18:00:00",
        end_time: "20:00:00",
        recurring: false,
        specific_date: "2025-12-05",
      });

    expect(oneTimeError).toBeNull();

    // Verify both windows were created
    const { data: windows, error: fetchError } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId);

    expect(fetchError).toBeNull();
    expect(windows).toHaveLength(2);

    const recurringWindow = windows!.find((w) => w.recurring === true);
    const oneTimeWindow = windows!.find((w) => w.recurring === false);

    expect(recurringWindow).toMatchObject({
      day_of_week: "MONDAY",
      start_time: "10:00:00",
      end_time: "12:00:00",
      recurring: true,
      specific_date: null,
    });

    expect(oneTimeWindow).toMatchObject({
      day_of_week: "FRIDAY",
      start_time: "18:00:00",
      end_time: "20:00:00",
      recurring: false,
      specific_date: "2025-12-05",
    });
  });

  it("should update a recurring window's time", async () => {
    // First, get the recurring window
    const { data: windowsBefore } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId)
      .eq("recurring", true)
      .single();

    expect(windowsBefore).toBeDefined();

    // Delete the old window (simulating what the calendar does)
    const { error: deleteError } = await supabase
      .from("schedule_preference_windows")
      .delete()
      .eq("preference_id", testPreferenceId)
      .eq("day_of_week", "MONDAY")
      .eq("start_time", "10:00:00")
      .eq("end_time", "12:00:00")
      .eq("recurring", true);

    expect(deleteError).toBeNull();

    // Insert the updated window (Monday 14-16 instead of 10-12)
    const { error: insertError } = await supabase
      .from("schedule_preference_windows")
      .insert({
        preference_id: testPreferenceId,
        day_of_week: "MONDAY",
        start_time: "14:00:00",
        end_time: "16:00:00",
        recurring: true,
      });

    expect(insertError).toBeNull();

    // Verify the window was updated
    const { data: updatedWindow } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId)
      .eq("recurring", true)
      .single();

    expect(updatedWindow).toMatchObject({
      day_of_week: "MONDAY",
      start_time: "14:00:00",
      end_time: "16:00:00",
      recurring: true,
    });

    // Verify the one-time window is still there
    const { data: allWindows } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId);

    expect(allWindows).toHaveLength(2);
  });

  it("should toggle a window from recurring to one-time", async () => {
    // Get the current recurring window
    const { data: recurringWindow } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId)
      .eq("recurring", true)
      .single();

    expect(recurringWindow).toBeDefined();

    // Delete the recurring version
    const { error: deleteError } = await supabase
      .from("schedule_preference_windows")
      .delete()
      .eq("preference_id", testPreferenceId)
      .eq("day_of_week", recurringWindow!.day_of_week)
      .eq("start_time", recurringWindow!.start_time)
      .eq("end_time", recurringWindow!.end_time)
      .eq("recurring", true);

    expect(deleteError).toBeNull();

    // Insert as one-time with specific date
    const { error: insertError } = await supabase
      .from("schedule_preference_windows")
      .insert({
        preference_id: testPreferenceId,
        day_of_week: recurringWindow!.day_of_week,
        start_time: recurringWindow!.start_time,
        end_time: recurringWindow!.end_time,
        recurring: false,
        specific_date: "2025-12-08", // Monday
      });

    expect(insertError).toBeNull();

    // Verify the toggle worked - find the newly inserted one
    const { data: newWindow } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId)
      .eq("day_of_week", recurringWindow!.day_of_week)
      .eq("specific_date", "2025-12-08")
      .single();

    expect(newWindow).toBeDefined();
    expect(newWindow!.recurring).toBe(false);
    expect(newWindow!.specific_date).toBe("2025-12-08");
  });

  it("should handle deleting windows correctly", async () => {
    // Delete one of the one-time windows
    const { data: oneTimeWindows } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId)
      .eq("recurring", false);

    expect(oneTimeWindows).toHaveLength(2);

    const windowToDelete = oneTimeWindows![0];

    const { error: deleteError } = await supabase
      .from("schedule_preference_windows")
      .delete()
      .eq("preference_id", testPreferenceId)
      .eq("day_of_week", windowToDelete.day_of_week)
      .eq("start_time", windowToDelete.start_time)
      .eq("end_time", windowToDelete.end_time)
      .eq("recurring", windowToDelete.recurring)
      .eq("specific_date", windowToDelete.specific_date);

    expect(deleteError).toBeNull();

    // Verify only one window remains
    const { data: remainingWindows } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId);

    expect(remainingWindows).toHaveLength(1);
  });

  it("should correctly identify windows by composite key", async () => {
    // This test ensures we can have similar windows that differ only in recurring flag
    
    // First, clean up any existing windows
    await supabase
      .from("schedule_preference_windows")
      .delete()
      .eq("preference_id", testPreferenceId);
    
    // Add a recurring Friday 18-20
    const { error: recurringError } = await supabase
      .from("schedule_preference_windows")
      .insert({
        preference_id: testPreferenceId,
        day_of_week: "FRIDAY",
        start_time: "18:00:00",
        end_time: "20:00:00",
        recurring: true,
      });

    expect(recurringError).toBeNull();

    // Add a one-time Friday 18-20 on a different date
    const { error: oneTimeError } = await supabase
      .from("schedule_preference_windows")
      .insert({
        preference_id: testPreferenceId,
        day_of_week: "FRIDAY",
        start_time: "18:00:00",
        end_time: "20:00:00",
        recurring: false,
        specific_date: "2025-12-12",
      });

    expect(oneTimeError).toBeNull();

    // Verify both exist
    const { data: allWindows } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId)
      .eq("day_of_week", "FRIDAY")
      .eq("start_time", "18:00:00")
      .eq("end_time", "20:00:00");

    expect(allWindows).toHaveLength(2);
    expect(allWindows!.filter((w) => w.recurring)).toHaveLength(1);
    expect(allWindows!.filter((w) => !w.recurring)).toHaveLength(1);

    // Now delete just the recurring one
    const { error: deleteError } = await supabase
      .from("schedule_preference_windows")
      .delete()
      .eq("preference_id", testPreferenceId)
      .eq("day_of_week", "FRIDAY")
      .eq("start_time", "18:00:00")
      .eq("end_time", "20:00:00")
      .eq("recurring", true);

    expect(deleteError).toBeNull();

    // Verify only the one-time remains
    const { data: remainingWindows } = await supabase
      .from("schedule_preference_windows")
      .select("*")
      .eq("preference_id", testPreferenceId)
      .eq("day_of_week", "FRIDAY");

    expect(remainingWindows).toHaveLength(1);
    expect(remainingWindows![0].recurring).toBe(false);
    expect(remainingWindows![0].specific_date).toBe("2025-12-12");
  });
});

