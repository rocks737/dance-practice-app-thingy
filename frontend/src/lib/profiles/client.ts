"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { UserProfile, ProfileUpdateData, CreateProfileParams } from "./types";

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];

function getPostgrestErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if (!("code" in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

export async function getProfileByAuthUserId(
  authUserId: string,
): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    if (getPostgrestErrorCode(error) === "PGRST116") {
      return null;
    }
    console.error("Error fetching profile:", error);
    throw new Error(error.message);
  }
  return mapProfileRow(data);
}

export async function getProfileById(profileId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    if (getPostgrestErrorCode(error) === "PGRST116") {
      return null;
    }
    console.error("Error fetching profile:", error);
    throw new Error(error.message);
  }
  return mapProfileRow(data);
}

export async function updateProfile(
  profileId: string,
  updates: ProfileUpdateData,
): Promise<UserProfile> {
  const supabase = createClient();
  const updatePayload: UserProfileUpdate = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", profileId)
    .select()
    .single();
  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(error.message);
  }
  return mapProfileRow(data);
}

export async function createDefaultUserProfile(
  params: CreateProfileParams,
): Promise<UserProfile> {
  const supabase = createClient();
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", params.authUserId)
    .single();

  if (existingProfile) {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_user_id", params.authUserId)
      .single();
    if (!data) {
      throw new Error("Failed to fetch existing profile");
    }
    return mapProfileRow(data);
  }

  const insertData: Database["public"]["Tables"]["user_profiles"]["Insert"] = {
    auth_user_id: params.authUserId,
    email: params.email,
    first_name: params.firstName || "",
    last_name: params.lastName || "",
    display_name: params.displayName || null,
    primary_role: 0,
    wsdc_level: 1,
    competitiveness_level: 3,
    profile_visible: true,
    account_status: 0,
    bio: null,
    dance_goals: null,
    birth_date: null,
  };
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .insert(insertData)
    .select()
    .single();
  if (profileError) {
    console.error("Error creating user profile:", profileError);
    throw new Error("Failed to create user profile");
  }
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: profile.id,
    role: "DANCER",
  });
  if (roleError) {
    console.error("Error adding default role:", roleError);
  }
  return mapProfileRow(profile);
}

export async function ensureUserProfile(
  authUserId: string,
  email: string,
): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();
  if (profile) {
    return mapProfileRow(profile);
  }
  return await createDefaultUserProfile({ authUserId, email });
}

export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error("Error updating password:", error);
    throw new Error(error.message);
  }
}

function mapProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    email: row.email,
    bio: row.bio,
    danceGoals: row.dance_goals,
    birthDate: row.birth_date,
    profileVisible: row.profile_visible,
    primaryRole: row.primary_role,
    wsdcLevel: row.wsdc_level,
    competitivenessLevel: row.competitiveness_level,
    accountStatus: row.account_status,
    homeLocationId: row.home_location_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
