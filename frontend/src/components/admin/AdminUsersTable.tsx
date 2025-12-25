"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountStatus, ACCOUNT_STATUS_LABELS } from "@/lib/profiles/types";

export type AdminUserRoleRow = { role: string };

export type AdminUserRow = {
  id: string;
  auth_user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  account_status: number;
  profile_visible: boolean;
  created_at: string;
  user_roles?: AdminUserRoleRow[] | null;
};

function statusVariant(status: number): "default" | "secondary" | "destructive" {
  if (status === AccountStatus.ACTIVE) return "default";
  if (status === AccountStatus.SUSPENDED) return "secondary";
  return "destructive";
}

function generateTempPassword(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let out = "";
  const cryptoObj = typeof window !== "undefined" ? window.crypto : null;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint32Array(length);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
    return out;
  }
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function requestJson(url: string, init: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload;
}

function ResetPasswordDialog({
  user,
  onDone,
}: {
  user: AdminUserRow;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState(() => generateTempPassword());

  const title = user.display_name?.trim()
    ? user.display_name
    : `${user.first_name} ${user.last_name}`.trim() || user.email;

  return (
    <div className="inline-flex">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        Reset PW
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-lg rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reset password</h3>
              <button onClick={() => setOpen(false)} className="text-sm hover:underline">
                Close
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Set a new password for <span className="font-medium">{title}</span>. You’ll need to
              communicate it to them out-of-band.
            </p>

            <div className="mt-4 space-y-2">
              <Label htmlFor={`pw-${user.id}`}>New password</Label>
              <Input
                id={`pw-${user.id}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPassword(generateTempPassword())}
                  disabled={pending}
                >
                  Generate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(password);
                      toast.success("Copied to clipboard");
                    } catch {
                      toast.error("Copy failed");
                    }
                  }}
                  disabled={pending}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (password.trim().length < 8) {
                    toast.error("Password must be at least 8 characters");
                    return;
                  }
                  setPending(true);
                  try {
                    await requestJson(`/api/admin/users/${user.id}/reset-password`, {
                      method: "POST",
                      body: JSON.stringify({ newPassword: password }),
                    });
                    toast.success("Password reset");
                    setOpen(false);
                    onDone();
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to reset password");
                  } finally {
                    setPending(false);
                  }
                }}
                disabled={pending}
              >
                {pending ? "Resetting..." : "Reset"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [lastLoginByProfileId, setLastLoginByProfileId] = useState<Record<string, string | null>>(
    {},
  );

  const sortedUsers = useMemo(() => users, [users]);

  useEffect(() => {
    const profileIds = sortedUsers.map((u) => u.id).filter(Boolean);
    if (profileIds.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const payload = await requestJson("/api/admin/users/last-login", {
          method: "POST",
          body: JSON.stringify({ profileIds }),
        });
        if (!cancelled) {
          setLastLoginByProfileId(payload?.lastLoginByProfileId ?? {});
        }
      } catch (e: any) {
        // Non-blocking; the table still works without this.
        console.warn("Failed to load last login timestamps", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sortedUsers]);

  const setStatus = async (user: AdminUserRow, next: AccountStatus) => {
    setPendingId(user.id);
    try {
      await requestJson(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ accountStatus: next }),
      });
      toast.success("Updated");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update user");
    } finally {
      setPendingId(null);
    }
  };

  const softDelete = async (user: AdminUserRow) => {
    if (
      !confirm(
        `Soft delete ${user.email}? This sets account_status=DELETED and hides the profile.`,
      )
    ) {
      return;
    }
    await setStatus(user, AccountStatus.DELETED);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last login</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedUsers.map((u) => {
          const name = u.display_name?.trim()
            ? u.display_name
            : `${u.first_name} ${u.last_name}`.trim();
          const roles = (u.user_roles ?? []).map((r) => r.role).filter(Boolean);
          const status = (u.account_status ?? 0) as AccountStatus;
          const isPending = pendingId === u.id;
          const lastLoginIso = lastLoginByProfileId[u.id] ?? null;
          const lastLoginLabel = lastLoginIso ? new Date(lastLoginIso).toLocaleString() : "—";

          return (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{name || "—"}</span>
                  <span className="text-xs text-muted-foreground">{u.id}</span>
                </div>
              </TableCell>
              <TableCell className="break-all">{u.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {roles.length === 0 ? (
                    <Badge variant="secondary">DANCER</Badge>
                  ) : (
                    roles.map((role) => (
                      <Badge key={role} variant={role === "ADMIN" ? "destructive" : "secondary"}>
                        {role}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(status)}>
                  {ACCOUNT_STATUS_LABELS[status] ?? String(status)}
                </Badge>
                {!u.profile_visible && (
                  <span className="ml-2 text-xs text-muted-foreground">(hidden)</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">{lastLoginLabel}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {status === AccountStatus.SUSPENDED ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStatus(u, AccountStatus.ACTIVE)}
                      disabled={isPending}
                    >
                      Unsuspend
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStatus(u, AccountStatus.SUSPENDED)}
                      disabled={isPending || status === AccountStatus.DELETED}
                    >
                      Suspend
                    </Button>
                  )}

                  <ResetPasswordDialog
                    user={u}
                    onDone={() => {
                      router.refresh();
                    }}
                  />

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => softDelete(u)}
                    disabled={isPending || status === AccountStatus.DELETED}
                  >
                    Soft delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}



