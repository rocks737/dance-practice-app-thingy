import { test as base, type Page, expect } from "@playwright/test";
import {
  cleanupTestUser,
  createTestSchedulePreference,
  createTestUser,
  type TestUser,
} from "../src/__tests__/integration-utils";

type Fixtures = {
  authUser: TestUser;
  authPage: Page;
};

const PASSWORD = "testpassword123";

export const test = base.extend<Fixtures>({
  // Create a fresh Supabase user per worker to speed up runs while keeping isolation.
  authUser: [
    async ({}, use) => {
      const user = await createTestUser("DANCER");
      await createTestSchedulePreference(user.profileId, [
        {
          dayOfWeek: "MONDAY",
          startTime: "09:00",
          endTime: "10:00",
          recurring: true,
        },
      ]);

      await use(user);

      await cleanupTestUser(user);
    },
    { scope: "worker" },
  ],

  // Log in once per worker and provide an authenticated page.
  authPage: async ({ page, authUser }, use) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(authUser.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL(/\/matches/, { timeout: 15_000 });
    await use(page);
  },
});

export { expect };

