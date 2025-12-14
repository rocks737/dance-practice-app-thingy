import { test, expect } from "@playwright/test";
import {
  createAdminClient,
  createTestUser,
  cleanupTestUser,
  createTestSchedulePreference,
} from "../src/__tests__/integration-utils";

const PASSWORD = "testpassword123";

test.describe("Onboarding and profile completeness", () => {
  test("user without profile is redirected to profile onboarding", async ({ page }) => {
    const user = await createTestUser("DANCER");

    // Remove profile to simulate incomplete onboarding
    const admin = createAdminClient();
    await admin.from("user_profiles").delete().eq("id", user.profileId);

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    await cleanupTestUser(user);
  });

  test("user without schedule is redirected to schedule, then can reach matches after adding schedule", async ({
    page,
  }) => {
    const user = await createTestUser("DANCER");

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/schedule/);
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();

    // Add a basic schedule preference, then matches should allow access
    await createTestSchedulePreference(user.profileId, [
      { dayOfWeek: "TUESDAY", startTime: "10:00", endTime: "11:00", recurring: true },
    ]);

    await page.goto("/matches");
    await expect(page).toHaveURL(/\/matches/);
    await expect(page.getByRole("heading", { name: "Matches" })).toBeVisible();

    await cleanupTestUser(user);
  });
});

