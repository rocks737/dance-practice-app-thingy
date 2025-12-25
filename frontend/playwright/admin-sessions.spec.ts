import { test, expect, type Page } from "@playwright/test";
import {
  cleanupTestSession,
  cleanupTestUser,
  createTestSchedulePreference,
  createTestSession,
  createTestUser,
  type TestUser,
} from "../src/__tests__/integration-utils";

const PASSWORD = "testpassword123";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test.describe("Admin sessions (read-only)", () => {
  test("admin can view sessions and search by title", async ({ page }) => {
    let admin: TestUser | null = null;
    let organizer: TestUser | null = null;
    let sessionId: string | null = null;

    try {
      admin = await createTestUser("ADMIN");
      organizer = await createTestUser("DANCER");

      await createTestSchedulePreference(admin.profileId, [
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", recurring: true },
      ]);

      const title = `pw-admin-session-${Date.now()}`;
      const session = await createTestSession(organizer.profileId, undefined, {
        title,
        status: "SCHEDULED",
        visibility: "PUBLIC",
      });
      sessionId = session.sessionId;

      await login(page, admin.email, PASSWORD);
      await page.waitForURL(/\/matches/, { timeout: 15_000 });

      await page.goto("/admin/sessions");
      await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();

      await page.getByPlaceholder("Search by title…").fill(title);
      await page.getByRole("button", { name: "Apply" }).click();

      const row = page.locator("tr", { hasText: title });
      await expect(row).toBeVisible();
      await expect(row).toContainText("SCHEDULED");
      await expect(row).toContainText(sessionId!);
    } finally {
      if (sessionId) {
        await cleanupTestSession(sessionId);
      }
      await cleanupTestUser(organizer ?? undefined);
      await cleanupTestUser(admin ?? undefined);
    }
  });
});


