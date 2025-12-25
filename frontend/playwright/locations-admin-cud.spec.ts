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
  await page.waitForURL(/\/matches/, { timeout: 15_000 });
}

test.describe("Locations CUD is admin-only", () => {
  test("non-admin cannot see create/edit controls", async ({ page }) => {
    let user: TestUser | null = null;
    try {
      user = await createTestUser("DANCER");
      await createTestSchedulePreference(user.profileId, [
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", recurring: true },
      ]);

      await login(page, user.email, PASSWORD);
      await page.goto("/locations");
      await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();

      await expect(page.getByRole("button", { name: "New location" })).toHaveCount(0);
      await expect(page.getByTitle("Edit location")).toHaveCount(0);
    } finally {
      await cleanupTestUser(user ?? undefined);
    }
  });

  test("admin can create and delete a location", async ({ page }) => {
    let admin: TestUser | null = null;

    try {
      admin = await createTestUser("ADMIN");
      await createTestSchedulePreference(admin.profileId, [
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", recurring: true },
      ]);

      await login(page, admin.email, PASSWORD);

      const name = `PW Location ${Date.now()}`;
      await page.goto(`/locations?q=${encodeURIComponent(name)}`);
      await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();

      await expect(page.getByRole("button", { name: "New location" })).toBeVisible();
      await page.getByRole("button", { name: "New location" }).click();

      await page.getByLabel("Name").fill(name);
      await page.getByLabel("City").fill("Test City");
      await page.getByLabel("State").fill("CA");
      await page.getByLabel("Country").fill("USA");
      await page.getByRole("button", { name: "Save" }).click();

      // New location should appear in filtered results
      await expect(page.getByText(name)).toBeVisible();

      // Find its card and open edit (click the pencil button within the card)
      const nameHeading = page.getByRole("heading", { name });
      await expect(nameHeading).toBeVisible();
      const card = nameHeading.locator("..").locator(".."); // heading -> container -> card
      await card.getByTitle("Edit location").click();

      page.once("dialog", (d) => d.accept());
      await page.getByRole("button", { name: "Delete" }).click();

      // Ensure it disappears (may take a refresh)
      await expect(page.getByText(name)).toHaveCount(0, { timeout: 15_000 });
    } finally {
      await cleanupTestUser(admin ?? undefined);
    }
  });
});


