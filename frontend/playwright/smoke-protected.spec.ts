import { test, expect } from "./fixtures";

test.describe("@smoke protected routes", () => {
  test("@smoke redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/matches");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible({ timeout: 10_000 });
  });

  test("@smoke authenticated user reaches matches", async ({ authPage }) => {
    await expect(authPage).toHaveURL(/\/matches/);
    await expect(authPage.getByRole("heading", { name: "Matches" })).toBeVisible();
  });
});

