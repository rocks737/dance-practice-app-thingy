import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AdminSessionsPageProps {
  searchParams?: {
    q?: string;
    status?: string;
    page?: string;
  };
}

type SessionRow = {
  id: string;
  title: string;
  session_type: string;
  status: string;
  visibility: string;
  scheduled_start: string;
  scheduled_end: string;
  location: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  } | null;
  organizer: {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    email: string;
  } | null;
};

function organizerLabel(o: SessionRow["organizer"]) {
  if (!o) return "—";
  const name = o.display_name?.trim() ? o.display_name : `${o.first_name} ${o.last_name}`.trim();
  return name || o.email;
}

function locationLabel(l: SessionRow["location"]) {
  if (!l) return "—";
  const place = [l.city, l.state].filter(Boolean).join(", ");
  return place ? `${l.name} (${place})` : l.name;
}

export default async function AdminSessionsPage({ searchParams }: AdminSessionsPageProps) {
  const supabase = await createClient();

  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "any").trim();
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("sessions")
    .select(
      `
        id,
        title,
        session_type,
        status,
        visibility,
        scheduled_start,
        scheduled_end,
        location:locations!fk_sessions_location (
          id,
          name,
          city,
          state
        ),
        organizer:user_profiles!fk_sessions_organizer (
          id,
          first_name,
          last_name,
          display_name,
          email
        )
      `,
      { count: "exact" },
    )
    .order("scheduled_start", { ascending: false })
    .range(from, to);

  if (status && status !== "any") {
    query = query.eq("status", status);
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as SessionRow[];
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
          <Home className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Sessions</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="mb-4 grid gap-2 md:grid-cols-6" action="/admin/sessions" method="get">
            <div className="relative md:col-span-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search by title…"
                className="pl-8"
              />
            </div>
            <div className="md:col-span-1">
              <select
                name="status"
                defaultValue={status || "any"}
                className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                aria-label="Filter by status"
              >
                <option value="any">Any status</option>
                <option value="PROPOSED">PROPOSED</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div className="md:col-span-1 flex items-center justify-end gap-2">
              <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                Apply
              </button>
              <a
                href="/admin/sessions"
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Reset
              </a>
            </div>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const start = new Date(s.scheduled_start);
                const end = new Date(s.scheduled_end);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm">{start.toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {start.toLocaleTimeString()}–{end.toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[240px]">
                      <div className="flex flex-col">
                        <span className="font-medium">{s.title}</span>
                        <span className="text-xs text-muted-foreground">{s.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.status}</Badge>
                    </TableCell>
                    <TableCell className="min-w-[180px]">{organizerLabel(s.organizer)}</TableCell>
                    <TableCell className="min-w-[220px]">{locationLabel(s.location)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.visibility}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">{s.session_type}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No sessions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {rows.length} of {total} sessions
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/admin/sessions?${new URLSearchParams({
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
                href={`/admin/sessions?${new URLSearchParams({
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


