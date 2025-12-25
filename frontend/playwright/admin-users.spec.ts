import { test, expect, type Page } from "@playwright/test";
import {
  cleanupTestUser,
  createTestSchedulePreference,
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

test.describe("Admin users panel", () => {
  test("admin can suspend/unsuspend, reset password, and soft delete", async ({ page }) => {
    let admin: TestUser | null = null;
    let target: TestUser | null = null;

    try {
      admin = await createTestUser("ADMIN");
      target = await createTestUser("DANCER");

      // Ensure both can land on /matches after login (some pages assume schedule prefs exist).
      await createTestSchedulePreference(admin.profileId, [
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", recurring: true },
      ]);
      await createTestSchedulePreference(target.profileId, [
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", recurring: true },
      ]);

      // Login as admin
      await login(page, admin.email, PASSWORD);
      await page.waitForURL(/\/matches/, { timeout: 15_000 });

      // Admin link should be visible
      await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();

      await page.goto("/admin/users");
      await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();

      // Search for target
      await page.getByPlaceholder("Search by name or email…").fill(target.email);
      await page.getByRole("button", { name: "Search" }).click();

      const row = page.locator("tr", { hasText: target.email });
      await expect(row).toBeVisible();
      await expect(row).toContainText(/Active|Suspended|Deleted/);

      // Suspend
      await row.getByRole("button", { name: "Suspend" }).click();
      await expect(row).toContainText("Suspended");

      // Unsuspend
      await row.getByRole("button", { name: "Unsuspend" }).click();
      await expect(row).toContainText("Active");

      // Reset password (set a known value)
      const newPassword = "NewPassw0rd!234";
      await row.getByRole("button", { name: "Reset PW" }).click();
      await page.getByLabel("New password").fill(newPassword);
      await page.getByRole("button", { name: "Reset" }).click();

      // Soft delete (confirm)
      page.once("dialog", (d) => d.accept());
      await row.getByRole("button", { name: "Soft delete" }).click();
      await expect(row).toContainText("Deleted");
      await expect(row).toContainText("(hidden)");

      // Verify deleted user can no longer access protected routes after login
      await page.getByRole("button", { name: "Sign Out" }).click();
      await expect(page).toHaveURL(/\/login/);

      await login(page, target.email, newPassword);
      await page.waitForURL(/\/account-disabled/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: /Account (suspended|deleted)/i })).toBeVisible();
    } finally {
      await cleanupTestUser(target ?? undefined);
      await cleanupTestUser(admin ?? undefined);
    }
  });
});


