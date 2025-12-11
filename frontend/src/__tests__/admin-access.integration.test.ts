/**
 * Admin access integration tests: verify ADMIN role unlocks data that
 * is hidden from non-admins via RLS (session_invites here).
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestUser, cleanupTestUser } from "./integration-utils";

describe("Admin access - Integration", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let proposer: Awaited<ReturnType<typeof createTestUser>>;
  let invitee: Awaited<ReturnType<typeof createTestUser>>;
  let inviteId: string | undefined;

  beforeAll(async () => {
    adminUser = await createTestUser("ADMIN");
    proposer = await createTestUser("DANCER");
    invitee = await createTestUser("DANCER");
  });

  afterAll(async () => {
    await cleanupTestUser(adminUser);
    await cleanupTestUser(proposer);
    await cleanupTestUser(invitee);
  });

  it("ADMIN can see invites they are not part of; non-admin cannot", async () => {
    // Proposer -> Invitee
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const { data, error } = await proposer.supabase.rpc("propose_practice_session", {
      p_invitee_id: invitee.profileId,
      p_start: start.toISOString(),
      p_end: end.toISOString(),
      p_note: "Admin visibility test",
    });
    expect(error).toBeNull();
    inviteId = (Array.isArray(data) ? data[0] : data)?.invite_id;
    expect(inviteId).toBeDefined();

    // Non-admin unrelated user cannot see it
    const other = await createTestUser("DANCER");
    const { data: nonAdminView, error: nonAdminErr } = await other.supabase
      .from("session_invites")
      .select("id")
      .eq("id", inviteId!)
      .maybeSingle();
    expect(nonAdminErr).toBeNull();
    expect(nonAdminView).toBeNull();
    await cleanupTestUser(other);

    // ADMIN can see it
    const { data: adminView, error: adminErr } = await adminUser.supabase
      .from("session_invites")
      .select("id")
      .eq("id", inviteId!)
      .maybeSingle();
    expect(adminErr).toBeNull();
    expect(adminView?.id).toBe(inviteId);
  });
});
