import { test, expect } from "./fixtures";
import {
  cleanupTestSession,
  cleanupTestUser,
  createTestSession,
  createTestUser,
  type TestUser,
} from "../src/__tests__/integration-utils";

test.describe("Sessions modal UX", () => {
  test("opens session details modal from the card and can close it", async ({
    authPage,
    authUser,
  }) => {
    const title = `PW Session Modal ${Date.now()}`;
    const created = await createTestSession(authUser.profileId, undefined, {
      title,
      status: "SCHEDULED",
      visibility: "PARTICIPANTS_ONLY",
    });
    let extra: TestUser | null = null;

    try {
      // Add participants so the modal can show the participant list.
      extra = await createTestUser("DANCER");
      await authUser.supabase.from("session_participants").insert([
        { session_id: created.sessionId, user_id: authUser.profileId },
        { session_id: created.sessionId, user_id: extra.profileId },
      ]);

      await authPage.goto("/sessions");
      await expect(authPage.getByRole("heading", { name: "Sessions" })).toBeVisible();

      // Find the session card and open details by clicking the title (cleaner UX).
      const openTitleButton = authPage.getByRole("button", {
        name: new RegExp(`^Open session details for ${escapeRegex(title)}$`, "i"),
      });
      await expect(openTitleButton).toBeVisible();
      await openTitleButton.click();

      const dialog = authPage.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(title)).toBeVisible();

      // As organizer, quick edit should be available in the modal.
      await expect(dialog.getByText("Quick edit")).toBeVisible();

      // Participants list should render (best-effort names)
      await expect(dialog.getByText(/Signed up participants/i)).toBeVisible();
      await expect(dialog.getByText(/Test DANCER/i).first()).toBeVisible();

      // Close (there may be multiple close buttons in Radix; click the footer one if present).
      const closeButtons = dialog.getByRole("button", { name: /close/i });
      await closeButtons.first().click();
      await expect(dialog).toHaveCount(0);
    } finally {
      await cleanupTestSession(created.sessionId);
      await cleanupTestUser(extra ?? undefined);
    }
  });
});

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


