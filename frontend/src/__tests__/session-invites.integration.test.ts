/**
 * Session Invites Integration Test
 * Exercises propose_practice_session and respond_to_session_invite RPCs
 * with real Supabase auth + RLS.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import {
  createTestUser,
  cleanupTestUser,
  cleanupTestSession,
  createAdminClient,
} from "./integration-utils";

type RpcRow = {
  session_id: string;
  invite_id: string;
  invite_status?: string | null;
};

describe("Session Invites - Integration", () => {
  let proposer: Awaited<ReturnType<typeof createTestUser>>;
  let invitee: Awaited<ReturnType<typeof createTestUser>>;
  let sessionIds: string[] = [];

  beforeAll(async () => {
    proposer = await createTestUser("DANCER");
    invitee = await createTestUser("DANCER");
  });

  afterEach(async () => {
    const ids = sessionIds;
    sessionIds = [];
    for (const id of ids) {
      await cleanupTestSession(id);
    }
  });

  afterAll(async () => {
    await cleanupTestUser(proposer);
    await cleanupTestUser(invitee);
  });

  function rangeFrom(offsetMinutes = 60, durationMinutes = 60) {
    const start = new Date(Date.now() + offsetMinutes * 60 * 1000);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  async function propose(toProfileId: string, start?: string, end?: string) {
    const window = start && end ? { start, end } : rangeFrom(60, 60);
    const { data, error } = await proposer.supabase.rpc("propose_practice_session", {
      p_invitee_id: toProfileId,
      p_start: window.start,
      p_end: window.end,
      p_note: "Integration test invite",
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as RpcRow | null;
    if (!row?.session_id || !row?.invite_id) {
      throw new Error("Invite RPC returned no ids");
    }
    sessionIds.push(row.session_id);
    return row;
  }

  it("allows proposing and accepting an invite", async () => {
    const invite = await propose(invitee.profileId);

    // Invitee accepts
    const { data: acceptData, error: acceptError } = await invitee.supabase.rpc(
      "respond_to_session_invite",
      { p_invite_id: invite.invite_id, p_action: "ACCEPT" },
    );
    expect(acceptError).toBeNull();
    const acceptRow = (Array.isArray(acceptData) ? acceptData[0] : acceptData) as RpcRow;
    expect(acceptRow.invite_status ?? "ACCEPTED").toMatch(/ACCEPT/i);

    // Verify status via invitee (RLS: proposer or invitee can read)
    const { data: inviteRow, error: fetchError } = await invitee.supabase
      .from("session_invites")
      .select("status")
      .eq("id", invite.invite_id)
      .single();
    expect(fetchError).toBeNull();
    expect(inviteRow!.status).toBe("ACCEPTED");

    // Verify participant record created
    const { data: participants, error: partError } = await invitee.supabase
      .from("session_participants")
      .select("user_id")
      .eq("session_id", invite.session_id)
      .eq("user_id", invitee.profileId);
    expect(partError).toBeNull();
    expect(participants?.length).toBe(1);
  });

  it("allows declining an invite and does not add participant", async () => {
    const invite = await propose(invitee.profileId);

    const { data: declineData, error: declineError } = await invitee.supabase.rpc(
      "respond_to_session_invite",
      { p_invite_id: invite.invite_id, p_action: "DECLINE" },
    );
    expect(declineError).toBeNull();
    const declineRow = (Array.isArray(declineData) ? declineData[0] : declineData) as RpcRow;
    expect(declineRow.invite_status ?? "DECLINED").toMatch(/DECLINE/i);

    const { data: participants } = await invitee.supabase
      .from("session_participants")
      .select("user_id")
      .eq("session_id", invite.session_id)
      .eq("user_id", invitee.profileId);
    expect(participants ?? []).toHaveLength(0);
  });

  it("prevents self-invite", async () => {
    const { start, end } = rangeFrom(30, 30);
    const { error } = await proposer.supabase.rpc("propose_practice_session", {
      p_invitee_id: proposer.profileId,
      p_start: start,
      p_end: end,
    });
    expect(error).toBeTruthy();
  });

  it("rejects accepting an expired invite", async () => {
    // Create a normal invite in the future, then force-expire it via admin update.
    const invite = await propose(invitee.profileId);

    const admin = createAdminClient();
    const { error: expireError } = await admin
      .from("session_invites")
      .update({ expires_at: new Date(Date.now() - 60 * 1000).toISOString() })
      .eq("id", invite.invite_id);
    expect(expireError).toBeNull();

    const { data: acceptData, error: acceptError } = await invitee.supabase.rpc(
      "respond_to_session_invite",
      {
      p_invite_id: invite.invite_id,
      p_action: "ACCEPT",
      },
    );
    expect(acceptError).toBeNull();
    const acceptRow = (Array.isArray(acceptData) ? acceptData[0] : acceptData) as RpcRow;
    expect((acceptRow.invite_status ?? "").toUpperCase()).toBe("EXPIRED");

    // Expiry is persisted on the row
    const { data: inviteRow, error: fetchError } = await proposer.supabase
      .from("session_invites")
      .select("status, expires_at")
      .eq("id", invite.invite_id)
      .single();
    expect(fetchError).toBeNull();
    expect(inviteRow!.status).toBe("EXPIRED");
    expect(inviteRow!.expires_at).toBeTruthy();
    expect(new Date(inviteRow!.expires_at as string).getTime()).toBeLessThan(Date.now());

    // Should not add invitee as a participant
    const { data: participants } = await invitee.supabase
      .from("session_participants")
      .select("user_id")
      .eq("session_id", invite.session_id)
      .eq("user_id", invitee.profileId);
    expect(participants ?? []).toHaveLength(0);
  });

  it("rejects proposing a session in the past", async () => {
    // Two days ago, 1 hour window.
    const pastStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const { error } = await proposer.supabase.rpc("propose_practice_session", {
      p_invitee_id: invitee.profileId,
      p_start: pastStart.toISOString(),
      p_end: pastEnd.toISOString(),
      p_note: "Past invite should be rejected",
    });

    expect(error).toBeTruthy();
    expect((error as any)?.message ?? "").toMatch(/start time must be in the future/i);
  });

  it("rejects proposing a session that overlaps an existing pending invite", async () => {
    const start1 = new Date(Date.now() + 60 * 60 * 1000);
    const end1 = new Date(start1.getTime() + 60 * 60 * 1000);
    await propose(invitee.profileId, start1.toISOString(), end1.toISOString());

    // Overlaps by 30 minutes
    const start2 = new Date(start1.getTime() + 30 * 60 * 1000);
    const end2 = new Date(start2.getTime() + 60 * 60 * 1000);
    const { error } = await proposer.supabase.rpc("propose_practice_session", {
      p_invitee_id: invitee.profileId,
      p_start: start2.toISOString(),
      p_end: end2.toISOString(),
      p_note: "Overlapping invite should be rejected",
    });

    expect(error).toBeTruthy();
    expect((error as any)?.message ?? "").toMatch(/overlaps this time/i);
  });

  it("sweeper persists status=EXPIRED for expired pending invites", async () => {
    const invite = await propose(invitee.profileId);

    // Force expiry
    const admin = createAdminClient();
    const { error: expireError } = await admin
      .from("session_invites")
      .update({ expires_at: new Date(Date.now() - 60 * 1000).toISOString() })
      .eq("id", invite.invite_id);
    expect(expireError).toBeNull();

    // Run sweeper directly (cron will do this periodically in production)
    const { data: sweptCount, error: sweepError } = await admin.rpc(
      "expire_session_invites" as any,
    );
    expect(sweepError).toBeNull();
    expect(Number(sweptCount ?? 0)).toBeGreaterThanOrEqual(1);

    const { data: inviteRow, error: fetchError } = await proposer.supabase
      .from("session_invites")
      .select("status")
      .eq("id", invite.invite_id)
      .single();
    expect(fetchError).toBeNull();
    expect(inviteRow!.status).toBe("EXPIRED");
  });

  it("allows proposer to cancel a pending invite", async () => {
    const invite = await propose(invitee.profileId);

    // Proposer cancels
    const { data: cancelData, error: cancelError } = await proposer.supabase.rpc(
      "respond_to_session_invite",
      { p_invite_id: invite.invite_id, p_action: "CANCEL" },
    );
    expect(cancelError).toBeNull();
    const cancelRow = (Array.isArray(cancelData) ? cancelData[0] : cancelData) as RpcRow;
    expect((cancelRow.invite_status ?? "CANCELLED").toUpperCase()).toBe("CANCELLED");

    // Invitee should not be able to accept afterward
    const { error: acceptError } = await invitee.supabase.rpc("respond_to_session_invite", {
      p_invite_id: invite.invite_id,
      p_action: "ACCEPT",
    });
    expect(acceptError).toBeTruthy();
  });

  it("auto-accepts when invitee mirrors the same time back", async () => {
    const { start, end } = rangeFrom(90, 60);
    // Proposer -> Invitee (pending)
    const invite = await propose(invitee.profileId, start, end);

    // Invitee sends the same window back to proposer (should accept existing)
    const { data: mirrorData, error: mirrorError } = await invitee.supabase.rpc("propose_practice_session", {
      p_invitee_id: proposer.profileId,
      p_start: start,
      p_end: end,
      p_note: "mirror",
    });
    expect(mirrorError).toBeNull();
    const mirrorRow = (Array.isArray(mirrorData) ? mirrorData[0] : mirrorData) as RpcRow;
    expect((mirrorRow.invite_status ?? "").toUpperCase()).toBe("ACCEPTED");

    // Verify original invite is accepted
    const { data: inviteRow, error: fetchError } = await proposer.supabase
      .from("session_invites")
      .select("status")
      .eq("id", invite.invite_id)
      .single();
    expect(fetchError).toBeNull();
    expect(inviteRow!.status).toBe("ACCEPTED");

    // Session is scheduled and both participants present
    const { data: sessionRow, error: sessionError } = await proposer.supabase
      .from("sessions")
      .select("status")
      .eq("id", invite.session_id)
      .single();
    expect(sessionError).toBeNull();
    expect(sessionRow!.status).toBe("SCHEDULED");

    const { data: participants, error: partError } = await proposer.supabase
      .from("session_participants")
      .select("user_id")
      .eq("session_id", invite.session_id);
    expect(partError).toBeNull();
    const ids = (participants ?? []).map((p) => p.user_id);
    expect(ids).toEqual(expect.arrayContaining([proposer.profileId, invitee.profileId]));
  });

});
