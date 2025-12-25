"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type AdminReportUser = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string;
};

export type AdminReportSession = {
  id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
};

export type AdminReportRow = {
  id: string;
  created_at: string;
  category: string;
  status: string;
  description: string;
  admin_notes: string | null;
  handled_at: string | null;
  reporter: AdminReportUser | null;
  reported: AdminReportUser | null;
  session: AdminReportSession | null;
};

const STATUS_OPTIONS = ["OPEN", "ACKNOWLEDGED", "IN_REVIEW", "RESOLVED", "DISMISSED"] as const;

function requestJson(url: string, init: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  }).then(async (res) => {
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || `Request failed (${res.status})`);
    }
    return payload;
  });
}

function userLabel(u: AdminReportUser | null) {
  if (!u) return "—";
  const name = u.display_name?.trim() ? u.display_name : `${u.first_name} ${u.last_name}`.trim();
  return name || u.email;
}

export function AdminReportsTable({ reports }: { reports: AdminReportRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});

  const rows = useMemo(() => reports, [reports]);

  const save = async (reportId: string) => {
    setPendingId(reportId);
    try {
      await requestJson(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: draftStatus[reportId],
          adminNotes: draftNotes[reportId],
        }),
      });
      toast.success("Saved");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setPendingId(null);
    }
  };

  const markHandled = async (reportId: string, handled: boolean) => {
    setPendingId(reportId);
    try {
      await requestJson(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ handled }),
      });
      toast.success(handled ? "Marked handled" : "Reopened");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reporter → Reported</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Admin notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const isPending = pendingId === r.id;
          const status = draftStatus[r.id] ?? r.status;
          const notes = draftNotes[r.id] ?? r.admin_notes ?? "";
          const created = new Date(r.created_at);

          return (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm">{created.toLocaleDateString()}</span>
                  <span className="text-xs text-muted-foreground">
                    {created.toLocaleTimeString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{r.category}</Badge>
              </TableCell>
              <TableCell className="min-w-[180px]">
                <select
                  value={status}
                  onChange={(e) =>
                    setDraftStatus((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                  aria-label="Report status"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {r.handled_at && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Handled {new Date(r.handled_at).toLocaleString()}
                  </div>
                )}
              </TableCell>
              <TableCell className="min-w-[220px]">
                <div className="flex flex-col text-sm">
                  <span className="font-medium">{userLabel(r.reporter)}</span>
                  <span className="text-muted-foreground">→ {userLabel(r.reported)}</span>
                </div>
              </TableCell>
              <TableCell className="min-w-[260px]">
                <div className="text-sm whitespace-pre-wrap line-clamp-4">{r.description}</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.id}</div>
              </TableCell>
              <TableCell className="min-w-[260px]">
                <Textarea
                  value={notes}
                  onChange={(e) =>
                    setDraftNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  rows={3}
                  placeholder="Add admin notes…"
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => save(r.id)} disabled={isPending}>
                    Save
                  </Button>
                  {r.handled_at ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => markHandled(r.id, false)}
                      disabled={isPending}
                    >
                      Reopen
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => markHandled(r.id, true)}
                      disabled={isPending}
                    >
                      Mark handled
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}


