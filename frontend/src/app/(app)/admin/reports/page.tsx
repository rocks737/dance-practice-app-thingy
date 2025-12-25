import { ArrowLeft, AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminReportsTable, type AdminReportRow } from "@/components/admin/AdminReportsTable";

interface AdminReportsPageProps {
  searchParams?: {
    q?: string;
    status?: string;
    page?: string;
  };
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const supabase = await createClient();

  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "any").trim();
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("abuse_reports")
    .select(
      `
        id,
        created_at,
        category,
        status,
        description,
        admin_notes,
        handled_at,
        reporter:user_profiles!fk_abuse_reports_reporter (
          id,
          first_name,
          last_name,
          display_name,
          email
        ),
        reported:user_profiles!fk_abuse_reports_reported_user (
          id,
          first_name,
          last_name,
          display_name,
          email
        ),
        session:sessions!fk_abuse_reports_session (
          id,
          title,
          scheduled_start,
          scheduled_end
        )
      `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "any") {
    query = query.eq("status", status);
  }
  if (q) {
    query = query.or(`description.ilike.%${q}%,admin_notes.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as AdminReportRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Abuse Reports</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="mb-4 grid gap-2 md:grid-cols-6" action="/admin/reports" method="get">
            <div className="relative md:col-span-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search descriptions / notes…"
                className="pl-8"
              />
            </div>
            <div className="md:col-span-2">
              <select
                name="status"
                defaultValue={status || "any"}
                className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                aria-label="Filter by status"
              >
                <option value="any">Any status</option>
                <option value="OPEN">OPEN</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="DISMISSED">DISMISSED</option>
              </select>
            </div>
            <div className="md:col-span-1 flex items-center justify-end gap-2">
              <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                Apply
              </button>
              <a
                href="/admin/reports"
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Reset
              </a>
            </div>
          </form>

          <AdminReportsTable reports={rows} />

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {rows.length} of {total} reports
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/admin/reports?${new URLSearchParams({
                  q,
                  status,
                  page: String(Math.max(1, page - 1)),
                }).toString()}`}
                className="rounded-md border px-3 py-1.5 hover:bg-accent hover:text-accent-foreground"
                aria-disabled={page <= 1}
              >
                Previous
              </a>
              <span>
                Page {page} of {totalPages}
              </span>
              <a
                href={`/admin/reports?${new URLSearchParams({
                  q,
                  status,
                  page: String(Math.min(totalPages, page + 1)),
                }).toString()}`}
                className="rounded-md border px-3 py-1.5 hover:bg-accent hover:text-accent-foreground"
                aria-disabled={page >= totalPages}
              >
                Next
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
