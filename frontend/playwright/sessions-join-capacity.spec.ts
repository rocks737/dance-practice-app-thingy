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

test.describe("Sessions join capacity", () => {
  test("join is disabled when a public session is full", async ({ browser }) => {
    const adminDb = createAdminClient();
    const title = `PW Full Session ${Date.now()}`;
    let organizer: TestUser | null = null;
    const joiners: TestUser[] = [];
    let fullUser: TestUser | null = null;
    let sessionId: string | null = null;

    try {
      organizer = await createTestUser("DANCER");
      for (let i = 0; i < 2; i++) {
        joiners.push(await createTestUser("DANCER"));
      }
      fullUser = await createTestUser("DANCER");

      // Create a public session with capacity 2.
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
          capacity: 2,
        })
        .select("id")
        .single();
      expect(error).toBeNull();
      sessionId = (created as any)?.id ?? null;
      expect(sessionId).toBeTruthy();

      // Fill the session (insert participants as admin).
      const { error: joinError } = await adminDb.from("session_participants").insert([
        { session_id: sessionId!, user_id: joiners[0].profileId },
        { session_id: sessionId!, user_id: joiners[1].profileId },
      ]);
      expect(joinError).toBeNull();

      // Full user opens the session modal and sees Join disabled with "full" message.
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await login(page, fullUser.email, PASSWORD);

      await page.goto("/sessions");
      await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();

      const open = page.getByRole("button", { name: new RegExp(title, "i") });
      await expect(open).toBeVisible();
      await open.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Join session" })).toBeDisabled();
      await expect(dialog.getByText(/this session is full/i)).toBeVisible();

      await ctx.close();
    } finally {
      if (sessionId) await cleanupTestSession(sessionId);
      await cleanupTestUser(fullUser ?? undefined);
      for (const u of joiners) await cleanupTestUser(u);
      await cleanupTestUser(organizer ?? undefined);
    }
  });
});


