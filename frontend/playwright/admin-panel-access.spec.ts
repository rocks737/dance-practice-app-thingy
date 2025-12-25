import { test, expect } from "./fixtures";

test.describe("Admin panel access control", () => {
  test("non-admin is redirected away from /admin", async ({ authPage }) => {
    await authPage.goto("/admin");
    // AdminLayout redirects non-admins to /profile
    await expect(authPage).toHaveURL(/\/profile/);
    await expect(authPage.getByRole("heading", { name: "Profile" })).toBeVisible();
  });

  test("non-admin is redirected away from /admin/users", async ({ authPage }) => {
    await authPage.goto("/admin/users");
    await expect(authPage).toHaveURL(/\/profile/);
    await expect(authPage.getByRole("heading", { name: "Profile" })).toBeVisible();
  });

  test("non-admin is redirected away from /admin/sessions", async ({ authPage }) => {
    await authPage.goto("/admin/sessions");
    await expect(authPage).toHaveURL(/\/profile/);
    await expect(authPage.getByRole("heading", { name: "Profile" })).toBeVisible();
  });

  test("sidebar does not show Admin link for non-admin", async ({ authPage }) => {
    // Sidebar is present on app routes; /matches is the landing page for authPage.
    await expect(authPage).toHaveURL(/\/matches/);
    await expect(authPage.getByRole("link", { name: "Admin" })).toHaveCount(0);
  });
});


