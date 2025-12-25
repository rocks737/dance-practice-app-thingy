import { test, expect } from "./fixtures";
import {
  cleanupTestLocation,
  cleanupTestSession,
  cleanupTestUser,
  createTestLocation,
  createTestUser,
  type TestUser,
} from "../src/__tests__/integration-utils";

const PASSWORD = "testpassword123";

test.describe("Sessions direct join", () => {
  test("users can join a public group practice via button and organizer sees participants", async ({
    authPage,
    authUser,
    browser,
  }) => {
    const title = `PW Join Session ${Date.now()}`;
    const location = await createTestLocation(`PW Location ${Date.now()}`, "Seattle", "WA");
    const extraUsers: TestUser[] = [];
    let sessionId: string | null = null;

    try {
      // Organizer creates a session via the UI (this should respect RLS).
      await authPage.goto("/sessions");
      await expect(authPage.getByRole("heading", { name: "Sessions" })).toBeVisible();

      await authPage.getByRole("button", { name: /new session/i }).click();
      const createDialog = authPage.getByRole("dialog");
      await expect(createDialog.getByRole("heading", { name: "Create session" })).toBeVisible();

      await createDialog.getByLabel("Title").fill(title);

      // Session type: select "Group practice"
      const sessionTypeRow = createDialog.getByText("Session type").locator("..");
      await sessionTypeRow.getByRole("combobox").click();
      await authPage.getByRole("option", { name: "Group practice" }).click();

      // Visibility must be PUBLIC for v1 direct join
      const visibilityRow = createDialog.getByText("Visibility").locator("..");
      await visibilityRow.getByRole("combobox").click();
      await authPage.getByRole("option", { name: "Public" }).click();

      // Pick a location
      await createDialog.getByLabel("Location").selectOption(location.locationId);

      await createDialog.getByRole("button", { name: /create session/i }).click();

      // Wait for the session row to exist (UI can be async after create).
      await expect
        .poll(
          async () => {
            const { data } = await authUser.supabase
              .from("sessions")
              .select("id")
              .eq("title", title)
              .eq("organizer_id", authUser.profileId)
              .maybeSingle();
            return data?.id ?? null;
          },
          { timeout: 15_000 },
        )
        .not.toBeNull();

      // After creation, the UI auto-opens the new session details modal.
      const dialog = authPage.getByRole("dialog");
      await expect(dialog.getByText(title)).toBeVisible({ timeout: 15_000 });

      // Grab session id for cleanup by querying as organizer (RLS allows reading sessions).
      const { data: createdSession } = await authUser.supabase
        .from("sessions")
        .select("id")
        .eq("title", title)
        .eq("organizer_id", authUser.profileId)
        .maybeSingle();
      sessionId = createdSession?.id ?? null;
      expect(sessionId).toBeTruthy();

      // Close the dialog before other users join (avoid any flakiness).
      await dialog.getByRole("button", { name: /close/i }).first().click();
      await expect(dialog).toHaveCount(0);

      // Create extra users and have each join via the UI button.
      for (let i = 0; i < 3; i++) {
        const u = await createTestUser("DANCER");
        extraUsers.push(u);

        const ctx = await browser.newContext();
        const page = await ctx.newPage();

        await page.goto("/login");
        await page.getByLabel("Email").fill(u.email);
        await page.getByLabel("Password").fill(PASSWORD);
        await page.getByRole("button", { name: "Sign In" }).click();
        await page.waitForURL(/\/matches/, { timeout: 15_000 });

        await page.goto("/sessions");
        await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();

        const open = page.getByRole("button", {
          name: new RegExp(escapeRegex(title), "i"),
        });
        await expect(open).toBeVisible();
        await open.click();

        const joinDialog = page.getByRole("dialog");
        await expect(joinDialog).toBeVisible();
        await joinDialog.getByRole("button", { name: "Join session" }).click();
        await expect(joinDialog.getByRole("button", { name: "Leave session" })).toBeVisible();

        await joinDialog.getByRole("button", { name: /close/i }).first().click();
        await expect(joinDialog).toHaveCount(0);

        await ctx.close();
      }

      // Organizer should see all participant names in the modal now.
      await authPage.goto("/sessions");
      await authPage
        .getByRole("button", { name: new RegExp(escapeRegex(title), "i") })
        .click();

      const organizerDialog = authPage.getByRole("dialog");
      await expect(organizerDialog.getByText(/Signed up participants/i)).toBeVisible();
      await expect(organizerDialog.locator("ul").locator("li")).toHaveCount(extraUsers.length);
    } finally {
      if (sessionId) {
        await cleanupTestSession(sessionId);
      }
      await cleanupTestLocation(location.locationId);
      for (const u of extraUsers) {
        await cleanupTestUser(u);
      }
    }
  });
});

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


