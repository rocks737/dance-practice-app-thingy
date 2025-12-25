import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createServiceRoleClient } from "@/lib/supabase/admin-server";

const BodySchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  try {
    await requireAdmin();
    const { profileId } = await context.params;
    const json = await request.json();
    const body = BodySchema.parse(json);

    const admin = createServiceRoleClient();

    // Resolve auth user id from profile.
    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select("auth_user_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile?.auth_user_id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
      password: body.newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "Forbidden";
    const status = msg === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}



