import { test, expect } from "./fixtures";
import {
  cleanupTestUser,
  createTestUser,
  type TestUser,
} from "../src/__tests__/integration-utils";

const PASSWORD = "testpassword123";

test.describe("Auth UX", () => {
  test("shows error on invalid password", async ({ page }) => {
    const user = await createTestUser("DANCER");

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
    await expect(page.getByRole("heading", { name: "Matches" })).toBeVisible();
  });

  test("sign out clears session and redirects to login", async ({ authPage }) => {
    await authPage.getByRole("button", { name: "Sign Out" }).click();
    await expect(authPage).toHaveURL(/\/login/);

    await authPage.goto("/matches");
    await expect(authPage).toHaveURL(/\/login/);
  });
});

