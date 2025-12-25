import { test, expect } from "./fixtures";
import {
  cleanupTestSession,
  cleanupTestUser,
  createTestUser,
  createAdminClient,
  type TestUser,
} from "../src/__tests__/integration-utils";

const PASSWORD = "testpassword123";

async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/matches/, { timeout: 15_000 });
}

test.describe("Sessions leave", () => {
  test("user can join then leave and modal updates", async ({ browser }) => {
    const adminDb = createAdminClient();
    const title = `PW Leave Session ${Date.now()}`;
    let organizer: TestUser | null = null;
    let user: TestUser | null = null;
    let sessionId: string | null = null;

    try {
      organizer = await createTestUser("DANCER");
      user = await createTestUser("DANCER");

      const start = new Date(Date.now() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const { data: created, error } = await adminDb
        .from("sessions")
        .insert({
          organizer_id: organizer.profileId,
          title,
          session_type: "GROUP_PRACTICE",
          status: "SCHEDULED",
          visibility: "PUBLIC",
          scheduled_start: start.toISOString(),
          scheduled_end: end.toISOString(),
          capacity: 10,
        })
        .select("id")
        .single();
      expect(error).toBeNull();
      sessionId = (created as any)?.id ?? null;
      expect(sessionId).toBeTruthy();

      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await login(page, user.email, PASSWORD);

      await page.goto("/sessions");
      await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();

      const open = page.getByRole("button", { name: new RegExp(title, "i") });
      await expect(open).toBeVisible();
      await open.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Join
      const joinBtn = dialog.getByRole("button", { name: "Join session" });
      await expect(joinBtn).toBeEnabled();
      await joinBtn.click();
      await expect(dialog.getByRole("button", { name: "Leave session" })).toBeVisible();
      // Should no longer show empty state.
      await expect(dialog.getByText(/No one has joined yet\./i)).toHaveCount(0);

      // Leave
      await dialog.getByRole("button", { name: "Leave session" }).click();
      await expect(dialog.getByRole("button", { name: "Join session" })).toBeVisible();
      await expect(dialog.getByText(/No one has joined yet\./i)).toBeVisible();

      await ctx.close();
    } finally {
      if (sessionId) await cleanupTestSession(sessionId);
      await cleanupTestUser(user ?? undefined);
      await cleanupTestUser(organizer ?? undefined);
    }
  });
});


