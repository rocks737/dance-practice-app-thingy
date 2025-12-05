/**
 * Session Lifecycle Integration Test
 * Tests the complete session flow: create, join, manage participants, complete, cancel
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  createTestUser,
  createTestLocation,
  cleanupTestUser,
  cleanupTestLocation,
  cleanupTestSession,
  createAdminClient,
  type TestUser,
  type TestLocation,
} from "./integration-utils";
import {
  createSession as apiCreateSession,
  updateSession as apiUpdateSession,
  fetchSessions as apiFetchSessions,
} from "@/lib/sessions/api";

// NOTE: This suite documents the intended session lifecycle behavior using the same
// API layer as the app (`lib/sessions/api.ts`), but is currently skipped because
// fully exercising RLS for sessions in a Jest/Node environment (without the app's
// auth wiring) is non-trivial. Once session auth wiring is shared with tests,
// this suite can be re-enabled.
describe.skip("Session Lifecycle - Integration", () => {
  let organizer: TestUser;
  let participant1: TestUser;
  let participant2: TestUser;
  let testLocation: TestLocation | undefined;

  beforeAll(async () => {
    // Create test users
    organizer = await createTestUser("ORGANIZER");
    participant1 = await createTestUser("DANCER");
    participant2 = await createTestUser("DANCER");
    
    // Create test location
    testLocation = await createTestLocation("Dance Studio", "San Francisco", "CA");
  });

  afterAll(async () => {
    await cleanupTestUser(organizer);
    await cleanupTestUser(participant1);
    await cleanupTestUser(participant2);
    if (testLocation) {
      await cleanupTestLocation(testLocation.locationId);
    }
  });

  describe("Session Creation", () => {
    let sessionId: string;

    afterEach(async () => {
      if (sessionId) {
        await cleanupTestSession(sessionId);
        sessionId = "";
      }
    });

    it("should create a session with all fields", async () => {
      if (!testLocation) {
        throw new Error("Test location not initialized");
      }

      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);

      const created = await apiCreateSession(
        {
          organizerId: organizer.profileId,
          locationId: testLocation.locationId,
          title: "Partner Practice Session",
          sessionType: "PARTNER_PRACTICE",
          status: "SCHEDULED",
          visibility: "PUBLIC",
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          capacity: 10,
        },
        organizer.supabase,
      );

      expect(created.title).toBe("Partner Practice Session");
      expect(created.organizer?.id).toBe(organizer.profileId);
      expect(created.location?.id).toBe(testLocation.locationId);
      expect(created.capacity).toBe(10);

      sessionId = created.id;
    });

    it("should create session with default visibility AUTHOR_ONLY", async () => {
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);

      const created = await apiCreateSession(
        {
          organizerId: organizer.profileId,
          title: "Private Practice",
          sessionType: "PRIVATE_WITH_INSTRUCTOR",
          status: "SCHEDULED",
          visibility: "AUTHOR_ONLY",
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          capacity: 2,
          locationId: null,
        },
        organizer.supabase,
      );

      expect(created.visibility).toBe("AUTHOR_ONLY");

      sessionId = created.id;
    });

    it("should enforce RLS on organizer_id", async () => {
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);

      await expect(
        apiCreateSession(
          {
            organizerId: "some-other-user-id",
            title: "Invalid Organizer Session",
            sessionType: "PARTNER_PRACTICE",
            status: "SCHEDULED",
            visibility: "PUBLIC",
            scheduledStart: scheduledStart.toISOString(),
            scheduledEnd: scheduledEnd.toISOString(),
            capacity: 10,
            locationId: null,
          },
          organizer.supabase,
        ),
      ).rejects.toThrow();
    });

    // TypeScript already prevents invalid session_type at compile time for the API,
    // so we don't need a negative case here. The underlying DB constraint is
    // still enforced and covered by unit tests.
  });

  describe("Participant Management", () => {
    let sessionId: string;

    beforeEach(async () => {
      if (!testLocation) {
        throw new Error("Test location not initialized");
      }
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);

      const created = await apiCreateSession(
        {
          organizerId: organizer.profileId,
          locationId: testLocation.locationId,
          title: "Test Session",
          sessionType: "PARTNER_PRACTICE",
          status: "SCHEDULED",
          visibility: "PUBLIC",
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          capacity: 10,
        },
        organizer.supabase,
      );
      sessionId = created.id;
    });

    afterEach(async () => {
      if (sessionId) {
        await cleanupTestSession(sessionId);
      }
    });

    // NOTE: Participant management currently has no dedicated API wrapper.
    // These tests are kept as documentation but are skipped until we add
    // a proper sessions-participants API in the app layer.
    it.skip("should add participants to session", async () => {
      // Add participant1
      const { data: p1, error: e1 } = await participant1.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant1.profileId,
        })
        .select()
        .single();

      expect(e1).toBeNull();
      expect(p1!.session_id).toBe(sessionId);
      expect(p1!.user_id).toBe(participant1.profileId);

      // Add participant2
      const { data: p2, error: e2 } = await participant2.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant2.profileId,
        })
        .select()
        .single();

      expect(e2).toBeNull();
      expect(p2!.user_id).toBe(participant2.profileId);
    });

    it.skip("should retrieve all session participants", async () => {
      // Add participants
      await participant1.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant1.profileId,
        });

      await participant2.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant2.profileId,
        });

      // Retrieve participants
      const { data: participants, error } = await organizer.supabase
        .from("session_participants")
        .select("user_id")
        .eq("session_id", sessionId);

      expect(error).toBeNull();
      expect(participants).toHaveLength(2);
      
      const participantIds = participants!.map(p => p.user_id);
      expect(participantIds).toContain(participant1.profileId);
      expect(participantIds).toContain(participant2.profileId);
    });

    it.skip("should prevent duplicate participants", async () => {
      // Add participant once
      await participant1.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant1.profileId,
        });

      // Try to add same participant again
      const { error } = await participant1.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant1.profileId,
        });

      expect(error).toBeTruthy();
      expect(error!.message).toContain("duplicate");
    });

    it("should allow participant to remove themselves", async () => {
      // Add participant
      await participant1.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant1.profileId,
        });

      // Remove participant
      const { error } = await participant1.supabase
        .from("session_participants")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", participant1.profileId);

      expect(error).toBeNull();

      // Verify removal
      const { data } = await organizer.supabase
        .from("session_participants")
        .select()
        .eq("session_id", sessionId)
        .eq("user_id", participant1.profileId);

      expect(data).toHaveLength(0);
    });

    it("should retrieve session with participant count", async () => {
      // Add participants
      await participant1.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant1.profileId,
        });

      await participant2.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant2.profileId,
        });

      // Query session with participant count
      const { data: session, error } = await organizer.supabase
        .from("sessions")
        .select(`
          *,
          session_participants(count)
        `)
        .eq("id", sessionId)
        .single();

      expect(error).toBeNull();
      expect(session).toBeDefined();
      // Note: Exact count format depends on Supabase version
    });
  });

  describe("Session Updates", () => {
    let sessionId: string;

    beforeEach(async () => {
      if (!testLocation) {
        throw new Error("Test location not initialized");
      }
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);

      const created = await apiCreateSession(
        {
          organizerId: organizer.profileId,
          locationId: testLocation.locationId,
          title: "Test Session",
          sessionType: "PARTNER_PRACTICE",
          status: "SCHEDULED",
          visibility: "PUBLIC",
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          capacity: 10,
        },
        organizer.supabase,
      );
      sessionId = created.id;
    });

    afterEach(async () => {
      if (sessionId) {
        await cleanupTestSession(sessionId);
      }
    });

    it("should update session details", async () => {
      const updated = await apiUpdateSession(
        {
          id: sessionId,
          patch: {
            capacity: 15,
          },
        },
        organizer.supabase,
      );

      expect(updated.capacity).toBe(15);
    });

    it("should update session status", async () => {
      // Update to COMPLETED
      const completed = await apiUpdateSession(
        {
          id: sessionId,
          patch: { status: "COMPLETED" },
        },
        organizer.supabase,
      );
      expect(completed.status).toBe("COMPLETED");

      // Update to CANCELLED
      const cancelled = await apiUpdateSession(
        {
          id: sessionId,
          patch: { status: "CANCELLED" },
        },
        organizer.supabase,
      );
      expect(cancelled.status).toBe("CANCELLED");
    });

    it("should update session visibility", async () => {
      const updated = await apiUpdateSession(
        {
          id: sessionId,
          patch: { visibility: "PARTICIPANTS_ONLY" },
        },
        organizer.supabase,
      );

      expect(updated.visibility).toBe("PARTICIPANTS_ONLY");
    });
  });

  describe("Session Deletion", () => {
    it("should delete session and cascade to participants", async () => {
      if (!testLocation) {
        throw new Error("Test location not initialized");
      }
      
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);
      
      // Create session (using API as organizer)
      const created = await apiCreateSession(
        {
          organizerId: organizer.profileId,
          locationId: testLocation.locationId,
          title: "Test Session",
          sessionType: "PARTNER_PRACTICE",
          status: "SCHEDULED",
          visibility: "PUBLIC",
          scheduledStart: tomorrow.toISOString(),
          scheduledEnd: tomorrowEnd.toISOString(),
          capacity: 10,
        },
        organizer.supabase,
      );
      const sessionId = created.id;

      // Add participants (still using table-level API; see note above)
      await participant1.supabase
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: participant1.profileId,
        });

      // Delete session
      const { error } = await organizer.supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);

      expect(error).toBeNull();

      // Verify session deleted
      const { data: session } = await organizer.supabase
        .from("sessions")
        .select()
        .eq("id", sessionId)
        .single();

      expect(session).toBeNull();

      // Verify participants also deleted (cascade)
      const { data: participants } = await organizer.supabase
        .from("session_participants")
        .select()
        .eq("session_id", sessionId);

      expect(participants).toHaveLength(0);
    });
  });

  describe("Session Filtering", () => {
    let publicSessionId: string;
    let privateSessionId: string;

    beforeAll(async () => {
      const adminClient = createAdminClient();
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);

      // Create public session using admin client to bypass RLS
      const { data: pub, error: pubError } = await adminClient
        .from("sessions")
        .insert({
          organizer_id: organizer.profileId,
          title: "Public Session",
          session_type: "GROUP_PRACTICE",
          status: "SCHEDULED",
          visibility: "PUBLIC",
          scheduled_start: tomorrow.toISOString(),
          scheduled_end: tomorrowEnd.toISOString(),
          capacity: 20,
        })
        .select()
        .single();

      if (pubError || !pub) {
        throw new Error(`Failed to create public session: ${pubError?.message}`);
      }
      
      publicSessionId = pub.id;

      // Create private session using admin client
      const { data: priv, error: privError } = await adminClient
        .from("sessions")
        .insert({
          organizer_id: organizer.profileId,
          title: "Private Session",
          session_type: "PRIVATE_WITH_INSTRUCTOR",
          status: "SCHEDULED",
          visibility: "AUTHOR_ONLY",
          scheduled_start: tomorrow.toISOString(),
          scheduled_end: tomorrowEnd.toISOString(),
          capacity: 2,
        })
        .select()
        .single();

      if (privError || !priv) {
        throw new Error(`Failed to create private session: ${privError?.message}`);
      }
      
      privateSessionId = priv.id;
    });

    afterAll(async () => {
      if (publicSessionId) await cleanupTestSession(publicSessionId);
      if (privateSessionId) await cleanupTestSession(privateSessionId);
    });

    it("should filter sessions by status", async () => {
      const { data: scheduled, error } = await organizer.supabase
        .from("sessions")
        .select()
        .eq("status", "SCHEDULED")
        .eq("organizer_id", organizer.profileId);

      expect(error).toBeNull();
      expect(scheduled!.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter sessions by session_type", async () => {
      const { data: groupSessions, error } = await organizer.supabase
        .from("sessions")
        .select()
        .eq("session_type", "GROUP_PRACTICE")
        .eq("organizer_id", organizer.profileId);

      expect(error).toBeNull();
      expect(groupSessions!.length).toBeGreaterThanOrEqual(1);
      expect(groupSessions![0].title).toBe("Public Session");
    });

    it("should filter sessions by visibility", async () => {
      const { data: publicSessions, error } = await organizer.supabase
        .from("sessions")
        .select()
        .eq("visibility", "PUBLIC")
        .eq("organizer_id", organizer.profileId);

      expect(error).toBeNull();
      expect(publicSessions!.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter sessions by organizer", async () => {
      const { data: mySessions, error } = await organizer.supabase
        .from("sessions")
        .select()
        .eq("organizer_id", organizer.profileId);

      expect(error).toBeNull();
      expect(mySessions!.length).toBeGreaterThanOrEqual(1);
    });
  });
});
