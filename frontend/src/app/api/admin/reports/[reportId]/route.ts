import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z
  .object({
    status: z.string().min(1).optional(),
    adminNotes: z.string().max(2000).nullable().optional(),
    handled: z.boolean().optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  try {
    await requireAdmin();
    const { reportId } = await context.params;
    const json = await request.json();
    const body = BodySchema.parse(json);

    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (body.status !== undefined) patch.status = body.status;
    if (body.adminNotes !== undefined) patch.admin_notes = body.adminNotes;
    if (body.handled !== undefined) patch.handled_at = body.handled ? new Date().toISOString() : null;

    const supabase = await createClient();
    const { error } = await supabase.from("abuse_reports").update(patch).eq("id", reportId);
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


