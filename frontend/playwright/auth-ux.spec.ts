import { test, expect } from "./fixtures";
import {
  cleanupTestUser,
  createTestUser,
  type TestUser,
} from "../src/__tests__/integration-utils";

const PASSWORD = "testpassword123";

async function createTestUserWithRetry(role: "DANCER" | "INSTRUCTOR" | "ORGANIZER" | "ADMIN") {
  let lastError: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      return await createTestUser(role);
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastError;
}

test.describe("Auth UX", () => {
  test("shows error on invalid password", async ({ page }) => {
    const user = await createTestUserWithRetry("DANCER");

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/Invalid email or password|Could not authenticate user/)).toBeVisible();

    await cleanupTestUser(user);
  });

  test("shows error for unknown email", async ({ page }) => {
    const email = `unknown-${Date.now()}@example.com`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/Invalid email or password|Could not authenticate user/)).toBeVisible();
  });

  test("protected route preserves returnUrl and redirects back after login", async ({ page, authUser }) => {
    await page.goto("/matches");
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(authUser.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/matches/);
    await expect(page.getByRole("heading", { name: "Matches", exact: true })).toBeVisible();
  });

  test("sign out clears session and redirects to login", async ({ authPage }) => {
    await authPage.getByRole("button", { name: "Sign Out" }).click();
    await expect(authPage).toHaveURL(/\/login/);

    await authPage.goto("/matches");
    await expect(authPage).toHaveURL(/\/login/);
  });
});

