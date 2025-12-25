import { test, expect } from "./fixtures";
import {
  cleanupTestLocation,
  cleanupTestSession,
  cleanupTestUser,
  createAdminClient,
  createTestLocation,
  createTestSchedulePreference,
  createTestUser,
} from "../src/__tests__/integration-utils";

test.describe("Matches: relationship counts (scheduled)", () => {
  test.describe.configure({ mode: "serial" });

  test("scheduled count includes future accepted SCHEDULED sessions", async ({ authPage, authUser }) => {
    const admin = createAdminClient();
    const candidate = await createTestUser("DANCER");
    const loc = await createTestLocation("PW Relationship Counts 1", "PW Relationship Counts 1", "CA");

    await admin
      .from("user_profiles")
      .update({ home_location_id: loc.locationId })
      .in("id", [authUser.profileId, candidate.profileId]);

    await createTestSchedulePreference(candidate.profileId, [
      { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:00", recurring: true },
    ]);

    const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const { data: createdSession, error: sessionError } = await admin
      .from("sessions")
      .insert({
        organizer_id: authUser.profileId,
        location_id: null,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        status: "SCHEDULED",
        visibility: "PARTICIPANTS_ONLY",
        session_type: "PARTNER_PRACTICE",
        title: "Future scheduled test session",
        capacity: 2,
      })
      .select("id")
      .single();
    if (sessionError) throw sessionError;

    const { error: inviteError } = await admin.from("session_invites").insert({
      session_id: createdSession.id,
      proposer_id: authUser.profileId,
      invitee_id: candidate.profileId,
      status: "ACCEPTED",
    });
    if (inviteError) throw inviteError;

    await authPage.goto("/matches");
    await authPage.getByRole("button", { name: /^Refresh$/ }).click();

    const potentialSection = authPage.locator("section", {
      has: authPage.getByRole("heading", { name: "Potential partners", exact: true }),
    });
    const card = potentialSection
      .getByRole("listitem")
      .filter({ has: authPage.getByText(new RegExp(candidate.firstName)) })
      .first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    await expect(card.getByText(/scheduled/i)).toBeVisible();
    await expect(card.getByText(/1\s*scheduled/i)).toBeVisible();

    await cleanupTestSession(createdSession.id);
    await cleanupTestUser(candidate);
    await cleanupTestLocation(loc.locationId);
  });

  test("scheduled count excludes completed (and past) accepted sessions", async ({ authPage, authUser }) => {
    const admin = createAdminClient();
    const candidate = await createTestUser("DANCER");
    const loc = await createTestLocation("PW Relationship Counts 2", "PW Relationship Counts 2", "CA");

    await admin
      .from("user_profiles")
      .update({ home_location_id: loc.locationId })
      .in("id", [authUser.profileId, candidate.profileId]);

    await createTestSchedulePreference(candidate.profileId, [
      { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:00", recurring: true },
    ]);

    const start = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const { data: createdSession, error: sessionError } = await admin
      .from("sessions")
      .insert({
        organizer_id: authUser.profileId,
        location_id: null,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        status: "COMPLETED",
        visibility: "PARTICIPANTS_ONLY",
        session_type: "PARTNER_PRACTICE",
        title: "Completed test session",
        capacity: 2,
      })
      .select("id")
      .single();
    if (sessionError) throw sessionError;

    const { error: inviteError } = await admin.from("session_invites").insert({
      session_id: createdSession.id,
      proposer_id: authUser.profileId,
      invitee_id: candidate.profileId,
      status: "ACCEPTED",
    });
    if (inviteError) throw inviteError;

    await authPage.goto("/matches");
    await authPage.getByRole("button", { name: /^Refresh$/ }).click();

    const potentialSection = authPage.locator("section", {
      has: authPage.getByRole("heading", { name: "Potential partners", exact: true }),
    });
    const card = potentialSection
      .getByRole("listitem")
      .filter({ has: authPage.getByText(new RegExp(candidate.firstName)) })
      .first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    // Relationship bar should not render at all when all counts are zero.
    await expect(card.getByText(/scheduled/i)).toHaveCount(0);

    await cleanupTestSession(createdSession.id);
    await cleanupTestUser(candidate);
    await cleanupTestLocation(loc.locationId);
  });
});


