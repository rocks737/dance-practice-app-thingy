import { test, expect, type Page } from "@playwright/test";
import {
  cleanupTestUser,
  createTestSchedulePreference,
  createTestUser,
  createAdminClient,
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
  test("admin can suspend/unsuspend, reset password, and soft delete", async ({ page, browser }) => {
    test.setTimeout(120_000);
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
      await page.waitForLoadState("networkidle");

      // Search for target
      await page.getByPlaceholder("Search by name or email…").fill(target.email);
      await page.getByRole("button", { name: "Search" }).click();
      await page.waitForLoadState("networkidle");

      const row = page.locator("tr", { hasText: target.email });
      await expect(row).toBeVisible();
      await expect(row).toContainText(/Active|Suspended|Deleted/);

      const adminDb = createAdminClient();
      // Wait for hydration (AdminUsersTable fetches last-login on mount).
      await page
        .waitForResponse(
          (r) => r.url().includes("/api/admin/users/last-login") && r.request().method() === "POST",
          { timeout: 15_000 },
        )
        .catch(() => {});

      // Suspend
      const suspendRespPromise = page.waitForResponse((r) => {
        return (
          r.url().includes(`/api/admin/users/${target?.profileId}/status`) &&
          r.request().method() === "PATCH"
        );
      }, { timeout: 30_000 });
      await row.getByRole("button", { name: "Suspend" }).click();
      const suspendResp = await suspendRespPromise;
      expect(suspendResp.ok()).toBeTruthy();
      await expect
        .poll(async () => {
          const { data } = await adminDb
            .from("user_profiles")
            .select("account_status")
            .eq("id", target!.profileId)
            .single();
          return (data as any)?.account_status ?? null;
        })
        .toBe(1);
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.getByPlaceholder("Search by name or email…").fill(target.email);
      await page.getByRole("button", { name: "Search" }).click();
      await page.waitForLoadState("networkidle");
      await page
        .waitForResponse(
          (r) => r.url().includes("/api/admin/users/last-login") && r.request().method() === "POST",
          { timeout: 15_000 },
        )
        .catch(() => {});
      await expect(page.locator("tr", { hasText: target.email })).toContainText("Suspended");

      // Unsuspend
      const row2 = page.locator("tr", { hasText: target.email });
      const unsuspendRespPromise = page.waitForResponse((r) => {
        return (
          r.url().includes(`/api/admin/users/${target?.profileId}/status`) &&
          r.request().method() === "PATCH"
        );
      }, { timeout: 30_000 });
      await row2.getByRole("button", { name: "Unsuspend" }).click();
      const unsuspendResp = await unsuspendRespPromise;
      expect(unsuspendResp.ok()).toBeTruthy();
      await expect
        .poll(async () => {
          const { data } = await adminDb
            .from("user_profiles")
            .select("account_status")
            .eq("id", target!.profileId)
            .single();
          return (data as any)?.account_status ?? null;
        })
        .toBe(0);
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.getByPlaceholder("Search by name or email…").fill(target.email);
      await page.getByRole("button", { name: "Search" }).click();
      await page.waitForLoadState("networkidle");
      await page
        .waitForResponse(
          (r) => r.url().includes("/api/admin/users/last-login") && r.request().method() === "POST",
          { timeout: 15_000 },
        )
        .catch(() => {});
      await expect(page.locator("tr", { hasText: target.email })).toContainText("Active");

      // Reset password (set a known value)
      const newPassword = "NewPassw0rd!234";
      const rowAfterUnsuspend = page.locator("tr", { hasText: target.email });
      await rowAfterUnsuspend.getByRole("button", { name: "Reset PW" }).click();
      const resetDialog = page.getByRole("dialog").filter({ hasText: "Reset password" });
      await expect(resetDialog).toBeVisible();
      await page.getByLabel("New password").fill(newPassword);
      const resetRespPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/api/admin/users/${target.profileId}/reset-password`) &&
          r.request().method() === "POST",
        { timeout: 30_000 },
      );
      await resetDialog.getByRole("button", { name: /^Reset$/ }).click();
      const resetResp = await resetRespPromise;
      expect(resetResp.ok()).toBeTruthy();

      // Soft delete (confirm)
      page.once("dialog", (d) => d.accept());
      const row3 = page.locator("tr", { hasText: target.email });
      await row3.getByRole("button", { name: "Soft delete" }).click();
      await expect
        .poll(async () => {
          const { data } = await adminDb
            .from("user_profiles")
            .select("account_status, profile_visible")
            .eq("id", target!.profileId)
            .single();
          return {
            status: (data as any)?.account_status ?? null,
            visible: (data as any)?.profile_visible ?? null,
          };
        })
        .toEqual({ status: 2, visible: false });
      await page.reload();
      await page.getByPlaceholder("Search by name or email…").fill(target.email);
      await page.getByRole("button", { name: "Search" }).click();
      const row4 = page.locator("tr", { hasText: target.email });
      await expect(row4).toContainText("Deleted");
      await expect(row4).toContainText("(hidden)");

      // Verify deleted user can no longer access protected routes after login (fresh context).
      const ctx = await browser.newContext();
      const targetPage = await ctx.newPage();
      await login(targetPage, target.email, newPassword);
      // Wait for navigation away from /login (either to /matches then middleware redirect, or directly to /account-disabled).
      await targetPage.waitForURL(/\/account-disabled|\/matches/, { timeout: 15_000 });
      if (targetPage.url().includes("/matches")) {
        // Force a full navigation to a protected route; middleware should redirect.
        await targetPage.goto("/matches");
        await targetPage.waitForURL(/\/account-disabled/, { timeout: 30_000 });
      }
      await expect(
        targetPage.getByRole("heading", { name: /Account (suspended|deleted)/i }),
      ).toBeVisible();
      await ctx.close();
    } finally {
      await cleanupTestUser(target ?? undefined);
      await cleanupTestUser(admin ?? undefined);
    }
  });
});


