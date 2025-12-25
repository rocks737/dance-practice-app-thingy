import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  accountStatus: z.number().int().min(0).max(2),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  try {
    await requireAdmin();
    const { profileId } = await context.params;
    const json = await request.json();
    const body = BodySchema.parse(json);

    const supabase = await createClient();
    const { error } = await supabase
      .from("user_profiles")
      .update({
        account_status: body.accountStatus,
        // If suspending/deleting, hide profile by default.
        profile_visible: body.accountStatus === 0 ? undefined : false,
        deleted_at: body.accountStatus === 2 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "Forbidden";
    const status = msg === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}



