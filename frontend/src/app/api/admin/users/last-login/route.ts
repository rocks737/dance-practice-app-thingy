import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createServiceRoleClient } from "@/lib/supabase/admin-server";

const BodySchema = z.object({
  profileIds: z.array(z.string().uuid()).min(1).max(200),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const json = await request.json();
    const body = BodySchema.parse(json);

    const admin = createServiceRoleClient();

    // Resolve auth user ids for the requested profiles.
    const { data: profiles, error: profileError } = await admin
      .from("user_profiles")
      .select("id, auth_user_id")
      .in("id", body.profileIds);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const authIdByProfileId = new Map<string, string>();
    for (const p of profiles ?? []) {
      if (p?.id && p?.auth_user_id) authIdByProfileId.set(p.id, p.auth_user_id);
    }

    const entries = await Promise.all(
      body.profileIds.map(async (profileId) => {
        const authUserId = authIdByProfileId.get(profileId);
        if (!authUserId) return [profileId, null] as const;
        const { data, error } = await admin.auth.admin.getUserById(authUserId);
        if (error || !data?.user) return [profileId, null] as const;
        return [profileId, data.user.last_sign_in_at ?? null] as const;
      }),
    );

    const lastLoginByProfileId: Record<string, string | null> = {};
    for (const [profileId, lastLoginAt] of entries) {
      lastLoginByProfileId[profileId] = lastLoginAt;
    }

    return NextResponse.json({ lastLoginByProfileId });
  } catch (e: any) {
    const msg = e?.message ?? "Forbidden";
    const status = msg === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}


