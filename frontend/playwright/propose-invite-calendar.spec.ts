import { test, expect } from "./fixtures";
import {
  cleanupTestLocation,
  cleanupTestUser,
  cleanupTestSession,
  createAdminClient,
  createTestLocation,
  createTestSchedulePreference,
  createTestUser,
} from "../src/__tests__/integration-utils";

test.describe("Propose session calendar week navigation", () => {
  test.describe.configure({ mode: "serial" });

  const toDatetimeLocal = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes(),
    )}`;
  };

  test("shows day headers with actual dates in the propose time dialog", async ({ authPage, authUser }) => {
    const admin = createAdminClient();
    const candidate = await createTestUser("DANCER");
    const loc = await createTestLocation("PW Shared City", "PW Shared City", "CA");

    // Matching is location-scoped; ensure both share the same home location.
    await admin
      .from("user_profiles")
      .update({ home_location_id: loc.locationId })
      .in("id", [authUser.profileId, candidate.profileId]);

    // Create an overlapping schedule preference for the candidate (authUser gets one in the fixture).
    await createTestSchedulePreference(candidate.profileId, [
      { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:00", recurring: true },
    ]);

    // Refresh matches so the candidate appears.
    await authPage.goto("/matches");
    await authPage.getByRole("button", { name: /^Refresh$/ }).click();

    const potentialSection = authPage.locator("section", {
      has: authPage.getByRole("heading", { name: "Potential partners", exact: true }),
    });
    const firstCard = potentialSection.getByRole("listitem").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });

    await firstCard.getByRole("button", { name: /propose time/i }).click();

    await expect(authPage.getByRole("heading", { name: /propose a practice time/i })).toBeVisible();

    // Week header contains day name + date, e.g. "Sunday, Jan 14"
    await expect(authPage.getByText(/^Sunday,\s+[A-Z][a-z]{2}\s+\d{1,2}$/)).toBeVisible();

    await cleanupTestUser(candidate);
    await cleanupTestLocation(loc.locationId);
  });

  test("week navigation updates the displayed week range", async ({ authPage, authUser }) => {
    const admin = createAdminClient();
    const candidate = await createTestUser("DANCER");
    const loc = await createTestLocation("PW Shared City 2", "PW Shared City 2", "CA");

    await admin
      .from("user_profiles")
      .update({ home_location_id: loc.locationId })
      .in("id", [authUser.profileId, candidate.profileId]);

    await createTestSchedulePreference(candidate.profileId, [
      { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:00", recurring: true },
    ]);

    await authPage.goto("/matches");
    await authPage.getByRole("button", { name: /^Refresh$/ }).click();
    const potentialSection = authPage.locator("section", {
      has: authPage.getByRole("heading", { name: "Potential partners", exact: true }),
    });
    const firstCard = potentialSection.getByRole("listitem").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });

    await firstCard.getByRole("button", { name: /propose time/i }).click();
    const dialog = authPage.getByRole("dialog", { name: /propose a practice time/i });
    await expect(dialog.getByRole("heading", { name: /propose a practice time/i })).toBeVisible();
    await expect(dialog.getByText(/Loading suggestions/i)).toHaveCount(0);

    // Wait for suggestions to finish loading; opening the dialog can snap the week
    // to the next overlapping suggestion occurrence (which is time-dependent).
    await expect(authPage.getByText(/Loading suggestions/i)).toHaveCount(0);

    const rangeLocator = authPage.getByText(/[A-Z][a-z]{2}\s+\d{1,2}\s+–\s+[A-Z][a-z]{2}\s+\d{1,2}/);
    const initialRange = (await rangeLocator.first().innerText()).trim();

    await authPage.getByRole("button", { name: /^Next$/ }).click();
    await expect(rangeLocator).not.toHaveText(initialRange);

    await authPage.getByRole("button", { name: /^Prev$/ }).click();
    await expect(rangeLocator).toHaveText(initialRange);

    await cleanupTestUser(candidate);
    await cleanupTestLocation(loc.locationId);
  });

  test("past weeks are visually darkened (past-date class on day columns)", async ({ authPage, authUser }) => {
    const admin = createAdminClient();
    const candidate = await createTestUser("DANCER");
    const loc = await createTestLocation("PW Past Days", "PW Past Days", "CA");

    await admin
      .from("user_profiles")
      .update({ home_location_id: loc.locationId })
      .in("id", [authUser.profileId, candidate.profileId]);

    await createTestSchedulePreference(candidate.profileId, [
      { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:00", recurring: true },
    ]);

    await authPage.goto("/matches");
    await authPage.getByRole("button", { name: /^Refresh$/ }).click();

    const potentialSection = authPage.locator("section", {
      has: authPage.getByRole("heading", { name: "Potential partners", exact: true }),
    });
    const firstCard = potentialSection.getByRole("listitem").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.getByRole("button", { name: /propose time/i }).click();
    const dialog = authPage.getByRole("dialog", { name: /propose a practice time/i });
    await expect(dialog.getByRole("heading", { name: /propose a practice time/i })).toBeVisible();
    await expect(dialog.getByText(/Loading suggestions/i)).toHaveCount(0);

    // Go to the current week, then to the previous week (entirely in the past).
    await authPage.getByRole("button", { name: /^Today$/ }).click();
    await authPage.getByRole("button", { name: /^Prev$/ }).click();

    // Past week should mark day columns with the past-date class.
    await expect(authPage.locator(".rbc-day-slot.past-date")).toHaveCount(7);

    await cleanupTestUser(candidate);
    await cleanupTestLocation(loc.locationId);
  });

  test("overlap blocks are not shown when they ended in the past (current week)", async ({ authPage, authUser }) => {
    // Freeze browser time to a mid-week point so "Today" week contains a past Monday.
    await authPage.addInitScript({
      content: `
        (function () {
          const fixed = new Date("2025-01-08T12:00:00Z").getTime(); // Wed noon UTC
          const RealDate = Date;
          function MockDate(...args) {
            if (this instanceof MockDate) {
              if (args.length === 0) return new RealDate(fixed);
              return new RealDate(...args);
            }
            return RealDate();
          }
          MockDate.now = () => fixed;
          MockDate.parse = RealDate.parse;
          MockDate.UTC = RealDate.UTC;
          MockDate.prototype = RealDate.prototype;
          // eslint-disable-next-line no-global-assign
          Date = MockDate;
        })();
      `,
    });
    await authPage.reload();

    const admin = createAdminClient();
    const candidate = await createTestUser("DANCER");
    const loc = await createTestLocation("PW Past Overlap", "PW Past Overlap", "CA");

    await admin
      .from("user_profiles")
      .update({ home_location_id: loc.locationId })
      .in("id", [authUser.profileId, candidate.profileId]);

    // Candidate overlaps with authUser's default Monday 09:00–10:00 window.
    await createTestSchedulePreference(candidate.profileId, [
      { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:00", recurring: true },
    ]);

    await authPage.goto("/matches");
    await authPage.getByRole("button", { name: /^Refresh$/ }).click();

    const potentialSection = authPage.locator("section", {
      has: authPage.getByRole("heading", { name: "Potential partners", exact: true }),
    });
    const firstCard = potentialSection.getByRole("listitem").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.getByRole("button", { name: /propose time/i }).click();
    const dialog = authPage.getByRole("dialog", { name: /propose a practice time/i });
    await expect(dialog.getByRole("heading", { name: /propose a practice time/i })).toBeVisible();
    await expect(dialog.getByText(/Loading suggestions/i)).toHaveCount(0);

    // On initial open, the dialog snaps to the next overlapping occurrence (future),
    // so overlap blocks (and possibly a selected-range event) should be visible.
    await expect(authPage.locator(".rbc-event")).not.toHaveCount(0);

    // Switch to "Today" week (Wed Jan 8, 2025); Monday overlap has already ended,
    // so overlap blocks should not render.
    await authPage.getByRole("button", { name: /^Today$/ }).click();
    await expect(authPage.locator(".rbc-event")).toHaveCount(0);

    await cleanupTestUser(candidate);
    await cleanupTestLocation(loc.locationId);
  });

  test("shows existing pending invites in the calendar and blocks overlapping proposals", async ({ authPage, authUser }) => {
    const admin = createAdminClient();
    const candidate = await createTestUser("DANCER");
    const loc = await createTestLocation("PW Existing Proposed", "PW Existing Proposed", "CA");

    await admin
      .from("user_profiles")
      .update({ home_location_id: loc.locationId })
      .in("id", [authUser.profileId, candidate.profileId]);

    // Candidate overlaps with authUser's default Monday 09:00–10:00 window.
    await createTestSchedulePreference(candidate.profileId, [
      { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:00", recurring: true },
    ]);

    await authPage.goto("/matches");
    await authPage.getByRole("button", { name: /^Refresh$/ }).click();

    const potentialSection = authPage.locator("section", {
      has: authPage.getByRole("heading", { name: "Potential partners", exact: true }),
    });
    const firstCard = potentialSection.getByRole("listitem").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.getByRole("button", { name: /propose time/i }).click();
    const dialog = authPage.getByRole("dialog", { name: /propose a practice time/i });
    await expect(dialog.getByRole("heading", { name: /propose a practice time/i })).toBeVisible();
    await expect(dialog.getByText(/Loading suggestions/i)).toHaveCount(0);

    // Use the suggested overlap chip so the proposed time is guaranteed to be in the currently displayed week.
    const suggestionChip = dialog.getByRole("button", { name: /^Monday\s+\d{2}:\d{2}–\d{2}:\d{2}$/ }).first();
    await expect(suggestionChip).toBeVisible();
    await suggestionChip.click();

    const startLocal = await dialog.getByLabel(/Start time/i).inputValue();
    const endLocal = await dialog.getByLabel(/End time/i).inputValue();
    expect(startLocal).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(endLocal).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

    await dialog.getByRole("button", { name: /send invite/i }).click();

    await expect(dialog.getByRole("heading", { name: /propose a practice time/i })).toBeHidden();
    await expect(authPage.getByRole("heading", { name: /Requests sent/i })).toContainText("(1)");

    // Reopen and ensure the existing invite is visible as a gray "existing-proposal-event" block.
    await firstCard.getByRole("button", { name: /propose time/i }).click();
    const dialog2 = authPage.getByRole("dialog", { name: /propose a practice time/i });
    await expect(dialog2.getByRole("heading", { name: /propose a practice time/i })).toBeVisible();
    await expect(dialog2.getByText(/Loading suggestions/i)).toHaveCount(0);

    // The dialog can remount after sending (due to parent refresh), so it may reopen on the "current"
    // week which might have no visible overlap blocks. Advance until the invite week shows events.
    for (let i = 0; i < 6; i++) {
      const count = await authPage.locator(".rbc-event").count();
      if (count > 0) break;
      await authPage.getByRole("button", { name: /^Next$/ }).click();
    }

    // We expect at least two blocks: the overlap availability block + the existing pending invite block.
    const eventCount = await authPage.locator(".rbc-event").count();
    expect(eventCount).toBeGreaterThanOrEqual(2);

    // Attempt to propose an overlapping window (same time) should be blocked with an inline error.
    await dialog2.getByLabel(/Start time/i).fill(startLocal);
    await dialog2.getByLabel(/End time/i).fill(endLocal);
    await dialog2.getByRole("button", { name: /send invite/i }).click();

    await expect(dialog2.getByText(/overlaps this time/i)).toBeVisible();

    // Cleanup: remove the created session/invite so subsequent tests start from a clean slate.
    const { data: createdInvites } = await admin
      .from("session_invites")
      .select("session_id")
      .eq("proposer_id", authUser.profileId)
      .eq("invitee_id", candidate.profileId);
    for (const row of createdInvites ?? []) {
      if (row.session_id) {
        await cleanupTestSession(row.session_id);
      }
    }

    await cleanupTestUser(candidate);
    await cleanupTestLocation(loc.locationId);
  });

  test("limits to 3 active outgoing practice requests per person", async ({ authPage, authUser }) => {
    const admin = createAdminClient();
    const candidate = await createTestUser("DANCER");
    const loc = await createTestLocation("PW Invite Limit", "PW Invite Limit", "CA");

    // Ensure a clean slate for this worker user (other tests may have created outgoing invites).
    const { data: existingOutgoing } = await admin
      .from("session_invites")
      .select("session_id")
      .eq("proposer_id", authUser.profileId);
    for (const row of existingOutgoing ?? []) {
      if (row.session_id) {
        await cleanupTestSession(row.session_id);
      }
    }

    await admin
      .from("user_profiles")
      .update({ home_location_id: loc.locationId })
      .in("id", [authUser.profileId, candidate.profileId]);

    // Candidate overlaps with authUser's default Monday 09:00–10:00 window.
    await createTestSchedulePreference(candidate.profileId, [
      { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:00", recurring: true },
    ]);

    await authPage.goto("/matches");
    await authPage.getByRole("button", { name: /^Refresh$/ }).click();

    const potentialSection = authPage.locator("section", {
      has: authPage.getByRole("heading", { name: "Potential partners", exact: true }),
    });
    const firstCard = potentialSection.getByRole("listitem").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.getByRole("button", { name: /propose time/i }).click();
    await expect(authPage.getByRole("heading", { name: /propose a practice time/i })).toBeVisible();

    // Helper to set datetime-local fields (future times) and submit.
    const setTimesAndSend = async (startIso: string, endIso: string) => {
      await authPage.getByLabel(/Start time/i).fill(toDatetimeLocal(startIso));
      await authPage.getByLabel(/End time/i).fill(toDatetimeLocal(endIso));
      await authPage.getByRole("button", { name: /send invite/i }).click();
    };

    const now = new Date();
    const mkIso = (daysAhead: number, hour: number, minute: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + daysAhead);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    };

    // Send 3 invites (future times, distinct windows).
    await setTimesAndSend(mkIso(7, 10, 0), mkIso(7, 11, 0));
    await expect(authPage.getByRole("heading", { name: /propose a practice time/i })).toBeHidden();
    await expect(authPage.getByRole("heading", { name: /Requests sent/i })).toContainText("(1)");
    await firstCard.getByRole("button", { name: /propose time/i }).click();

    await setTimesAndSend(mkIso(8, 10, 0), mkIso(8, 11, 0));
    await expect(authPage.getByRole("heading", { name: /propose a practice time/i })).toBeHidden();
    await expect(authPage.getByRole("heading", { name: /Requests sent/i })).toContainText("(2)");
    await firstCard.getByRole("button", { name: /propose time/i }).click();

    await setTimesAndSend(mkIso(9, 10, 0), mkIso(9, 11, 0));
    await expect(authPage.getByRole("heading", { name: /propose a practice time/i })).toBeHidden();
    await expect(authPage.getByRole("heading", { name: /Requests sent/i })).toContainText("(3)");
    await firstCard.getByRole("button", { name: /propose time/i }).click();

    // 4th should be rejected by RPC and show inline error.
    await setTimesAndSend(mkIso(10, 10, 0), mkIso(10, 11, 0));
    const dialog = authPage.getByRole("dialog", { name: /propose a practice time/i });
    await expect(
      dialog.getByText(/You already have 3 active practice requests to this person/i),
    ).toBeVisible();

    await cleanupTestUser(candidate);
    await cleanupTestLocation(loc.locationId);
  });
});


