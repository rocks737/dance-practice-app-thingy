import { ArrowLeft, Users, Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/AdminUsersTable";

interface AdminUsersPageProps {
  searchParams?: {
    q?: string;
    page?: string;
  };
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const supabase = await createClient();

  const q = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("user_profiles")
    .select(
      `
        id,
        auth_user_id,
        email,
        first_name,
        last_name,
        display_name,
        account_status,
        profile_visible,
        created_at,
        user_roles (
          role
        )
      `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(
      `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as AdminUserRow[];
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
          <Users className="w-8 h-8" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="mb-4 flex items-center gap-2" action="/admin/users" method="get">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search by name or email…"
                className="pl-8"
              />
            </div>
            <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              Search
            </button>
          </form>

          <AdminUsersTable users={rows} />

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {rows.length} of {total} users
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/admin/users?${new URLSearchParams({ q, page: String(Math.max(1, page - 1)) }).toString()}`}
                className="rounded-md border px-3 py-1.5 hover:bg-accent hover:text-accent-foreground"
                aria-disabled={page <= 1}
              >
                Previous
              </a>
              <span>
                Page {page} of {totalPages}
              </span>
              <a
                href={`/admin/users?${new URLSearchParams({ q, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
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
