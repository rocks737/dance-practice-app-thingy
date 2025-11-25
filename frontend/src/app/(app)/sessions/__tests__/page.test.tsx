import React from "react";
import { screen } from "@testing-library/react";
import { render } from "@/test/test-utils";
import SessionsPage from "@/app/(app)/sessions/page";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockSessionsExplorer = jest.fn((props: { authUserId: string }) => (
  <div data-testid="sessions-explorer" data-auth-user={props.authUserId} />
));

jest.mock("@/components/sessions/SessionsExplorer", () => ({
  SessionsExplorer: (props: { authUserId: string }) => mockSessionsExplorer(props),
}));

describe("SessionsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-123" } },
        }),
      },
    });
  });

  it("renders heading, description, and explorer", async () => {
    const Page = await SessionsPage();
    render(Page);

    expect(screen.getByRole("heading", { name: /sessions/i })).toBeInTheDocument();
    expect(
      screen.getByText(/search, filter, and manage your practice sessions/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("sessions-explorer")).toBeInTheDocument();
    expect(mockSessionsExplorer).toHaveBeenCalledWith(
      expect.objectContaining({ authUserId: "test-user-123" }),
    );
  });
});
