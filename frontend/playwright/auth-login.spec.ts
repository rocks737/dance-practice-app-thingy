import { test, expect } from "@playwright/test";
import {
  createTestSchedulePreference,
  createTestUser,
  cleanupTestUser,
  type TestUser,
} from "../src/__tests__/integration-utils";

test.describe("Login flow", () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = await createTestUser("DANCER");

    await createTestSchedulePreference(user.profileId, [
      {
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        recurring: true,
      },
    ]);
  });

  test.afterAll(async () => {
    await cleanupTestUser(user);
  });

  test("logs in and lands on matches", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill("testpassword123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/matches/);
    await expect(page.getByRole("heading", { name: "Matches", exact: true })).toBeVisible();
  });
});

