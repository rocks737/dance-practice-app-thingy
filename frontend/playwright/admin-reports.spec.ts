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

test.describe("Admin reports panel", () => {
  test("admin can update report status, notes, and handled flag", async ({ page }) => {
    let admin: TestUser | null = null;
    let reporter: TestUser | null = null;
    let reported: TestUser | null = null;
    let reportId: string | null = null;

    try {
      admin = await createTestUser("ADMIN");
      reporter = await createTestUser("DANCER");
      reported = await createTestUser("DANCER");

      await createTestSchedulePreference(admin.profileId, [
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", recurring: true },
      ]);

      const unique = `pw-e2e-report-${Date.now()}`;

      // Create a report as the reporter (RLS: reporter_id must equal current_profile_id()).
      const { data, error } = await reporter.supabase
        .from("abuse_reports")
        .insert({
          reporter_id: reporter.profileId,
          reported_user_id: reported.profileId,
          session_id: null,
          category: "SPAM",
          status: "OPEN",
          description: unique,
          admin_notes: null,
        })
        .select("id")
        .single();

      expect(error).toBeNull();
      reportId = (data as any)?.id ?? null;
      expect(reportId).toBeTruthy();

      // Login as admin
      await login(page, admin.email, PASSWORD);
      await page.waitForURL(/\/matches/, { timeout: 15_000 });

      await page.goto("/admin/reports");
      await expect(page.getByRole("heading", { name: "Abuse Reports" })).toBeVisible();
      await page.waitForLoadState("networkidle");

      // Search for our report
      await page.getByPlaceholder("Search descriptions / notes…").fill(unique);
      await page.getByRole("button", { name: "Apply" }).click();
      await page.waitForLoadState("networkidle");

      const row = page.locator("tr", { hasText: unique });
      await expect(row).toBeVisible();

      // Update status and notes, then save
      await row.locator('select[aria-label="Report status"]').selectOption("IN_REVIEW");
      await row.locator("textarea").fill("Reviewed by admin (playwright)");
      const saveRespPromise = page.waitForResponse((r) => {
        return r.url().includes(`/api/admin/reports/${reportId}`) && r.request().method() === "PATCH";
      }, { timeout: 30_000 });
      await row.getByRole("button", { name: "Save" }).click();
      const saveResp = await saveRespPromise;
      expect(saveResp.ok()).toBeTruthy();

      // Verify status + notes persisted in DB (router.refresh can be async; poll DB instead).
      const adminDb = createAdminClient();
      await expect
        .poll(async () => {
          const { data } = await adminDb
            .from("abuse_reports")
            .select("status, admin_notes")
            .eq("id", reportId!)
            .single();
          return { status: (data as any)?.status, notes: (data as any)?.admin_notes };
        })
        .toEqual({ status: "IN_REVIEW", notes: "Reviewed by admin (playwright)" });

      // Mark handled, then poll handled_at
      const handledRespPromise = page.waitForResponse((r) => {
        return r.url().includes(`/api/admin/reports/${reportId}`) && r.request().method() === "PATCH";
      }, { timeout: 30_000 });
      await row.getByRole("button", { name: "Mark handled" }).click();
      const handledResp = await handledRespPromise;
      expect(handledResp.ok()).toBeTruthy();
      await expect
        .poll(async () => {
          const { data } = await adminDb
            .from("abuse_reports")
            .select("handled_at")
            .eq("id", reportId!)
            .single();
          return Boolean((data as any)?.handled_at);
        })
        .toBe(true);
    } finally {
      // Cleanup report if still around; it will be cascaded if we delete profiles, but be explicit.
      if (reportId) {
        const adminDb = createAdminClient();
        await adminDb.from("abuse_reports").delete().eq("id", reportId);
      }
      await cleanupTestUser(reported ?? undefined);
      await cleanupTestUser(reporter ?? undefined);
      await cleanupTestUser(admin ?? undefined);
    }
  });
});


