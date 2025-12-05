/**
 * Shared utilities for integration tests
 * Provides common functions for creating and cleaning up test data
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { execSync } from "child_process";

/**
 * Gets Supabase credentials from the local Supabase CLI
 * This avoids hardcoding keys and works with any local instance
 */
function getSupabaseCredentials(): { url: string; anonKey: string; serviceRoleKey: string } {
  try {
    // Run supabase status to get credentials
    const output = execSync("npx supabase status -o env", {
      cwd: process.cwd().replace("/frontend", ""),
      encoding: "utf8",
    });

    // Parse the output
    const urlMatch = output.match(/API_URL="([^"]+)"/);
    const anonKeyMatch = output.match(/ANON_KEY="([^"]+)"/);
    const serviceKeyMatch = output.match(/SERVICE_ROLE_KEY="([^"]+)"/);

    if (!urlMatch || !anonKeyMatch || !serviceKeyMatch) {
      throw new Error("Failed to parse Supabase credentials from CLI output");
    }

    return {
      url: urlMatch[1],
      anonKey: anonKeyMatch[1],
      serviceRoleKey: serviceKeyMatch[1],
    };
  } catch (error) {
    console.error("Failed to get Supabase credentials from CLI:", error);
    // Fallback to environment variables or defaults
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
      anonKey:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
      serviceRoleKey:
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    };
  }
}

// Get credentials once at module load
const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey: supabaseServiceRoleKey } = getSupabaseCredentials();

export { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };

/**
 * Creates a Supabase client with service role (admin) privileges
 * Use this for operations that bypass RLS or need elevated permissions
 */
export function createAdminClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface TestUser {
  userId: string;
  profileId: string;
  email: string;
  supabase: ReturnType<typeof createClient<Database>>;
}

export interface TestSession {
  sessionId: string;
  organizerId: string;
}

export interface TestLocation {
  locationId: string;
  name: string;
}

/**
 * Creates a test user with profile
 */
export async function createTestUser(
  role: "DANCER" | "INSTRUCTOR" | "ORGANIZER" | "ADMIN" = "DANCER"
): Promise<TestUser> {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  const timestamp = Date.now();
  const email = `test-${role.toLowerCase()}-${timestamp}@example.com`;

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: "testpassword123",
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`);
  }

  const userId = authData.user.id;

  // Create user profile
  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      auth_user_id: userId,
      email: email,
      first_name: "Test",
      last_name: role,
      primary_role: 0, // DANCER
      competitiveness_level: 3,
      account_status: 0,
      profile_visible: true,
    })
    .select()
    .single();

  if (profileError || !profileData) {
    throw new Error(`Failed to create test profile: ${profileError?.message}`);
  }

  // Add role if not DANCER
  if (role !== "DANCER") {
    // Use admin client to bypass RLS for test setup
    const adminClient = createAdminClient();
    
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: profileData.id,
        role: role,
      });

    if (roleError) {
      throw new Error(`Failed to add role: ${roleError.message}`);
    }
  }

  return {
    userId,
    profileId: profileData.id,
    email,
    supabase,
  };
}

/**
 * Creates a test location
 */
export async function createTestLocation(
  name?: string,
  city?: string,
  state?: string
): Promise<TestLocation> {
  // Use admin client because normal users cannot create locations under RLS;
  // in the app this is done via an admin UI. For tests, we just need a seed location.
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("locations")
    .insert({
      name: name || `Test Location ${Date.now()}`,
      city: city || "Test City",
      state: state || "CA",
      country: "USA",
      postal_code: "12345",
      address_line1: "123 Test St",
      description: "Test location for integration tests",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test location: ${error?.message}`);
  }

  return {
    locationId: data.id,
    name: data.name,
  };
}

/**
 * Creates a test session
 */
export async function createTestSession(
  organizerId: string,
  locationId?: string,
  overrides?: {
    title?: string;
    sessionType?: string;
    status?: string;
    visibility?: string;
    scheduledStart?: Date;
    scheduledEnd?: Date;
    capacity?: number;
  }
): Promise<TestSession> {
  // Use admin client here because this is test setup, not simulating user behavior.
  // Actual user-facing tests (e.g. in session-lifecycle.integration.test.ts) create
  // sessions via the authenticated user client to respect RLS.
  const supabase = createAdminClient();
  
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      organizer_id: organizerId,
      location_id: locationId || null,
      title: overrides?.title || "Test Session",
      session_type: overrides?.sessionType || "PARTNER_PRACTICE",
      status: overrides?.status || "SCHEDULED",
      visibility: overrides?.visibility || "PUBLIC",
      scheduled_start: (overrides?.scheduledStart || defaultStart).toISOString(),
      scheduled_end: (overrides?.scheduledEnd || defaultEnd).toISOString(),
      capacity: overrides?.capacity || 10,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test session: ${error?.message}`);
  }

  return {
    sessionId: data.id,
    organizerId: data.organizer_id,
  };
}

/**
 * Creates a test schedule preference
 */
export async function createTestSchedulePreference(
  userId: string,
  windows?: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    recurring?: boolean;
    specificDate?: string;
  }>
): Promise<string> {
  // Use admin client here because this is test setup. In the app, schedule
  // preferences are created via the authenticated user client which must
  // satisfy RLS (user_id = current_profile_id()).
  const supabase = createAdminClient();

  const { data: preference, error: prefError } = await supabase
    .from("schedule_preferences")
    .insert({
      user_id: userId,
      notes: "Test preference",
    })
    .select()
    .single();

  if (prefError || !preference) {
    throw new Error(`Failed to create test preference: ${prefError?.message}`);
  }

  // Add windows if provided
  if (windows && windows.length > 0) {
    const { error: windowsError } = await supabase
      .from("schedule_preference_windows")
      .insert(
        windows.map((w) => ({
          preference_id: preference.id,
          day_of_week: w.dayOfWeek,
          start_time: w.startTime,
          end_time: w.endTime,
          recurring: w.recurring ?? true,
          specific_date: w.specificDate || null,
        }))
      );

    if (windowsError) {
      throw new Error(`Failed to add windows: ${windowsError.message}`);
    }
  }

  // Add required role
  const { error: roleError } = await supabase
    .from("schedule_preference_roles")
    .insert({
      preference_id: preference.id,
      role: "LEAD",
    });

  if (roleError) {
    throw new Error(`Failed to add preference role: ${roleError.message}`);
  }

  return preference.id;
}

/**
 * Cleans up test user and all related data
 */
export async function cleanupTestUser(testUser: TestUser | undefined): Promise<void> {
  if (!testUser) return;
  
  const { supabase, profileId, userId } = testUser;

  // Delete user profile (cascades to preferences, roles, etc.)
  await supabase.from("user_profiles").delete().eq("id", profileId);

  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);
}

/**
 * Cleans up test location
 */
export async function cleanupTestLocation(locationId: string): Promise<void> {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  await supabase.from("locations").delete().eq("id", locationId);
}

/**
 * Cleans up test session
 */
export async function cleanupTestSession(sessionId: string): Promise<void> {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  await supabase.from("sessions").delete().eq("id", sessionId);
}

/**
 * Waits for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

