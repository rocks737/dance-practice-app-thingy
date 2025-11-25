import { screen } from "@testing-library/react";
import { render, mockUser } from "@/test/test-utils";
import { AppSidebar } from "@/components/app/AppSidebar";

// Mock the hooks with realistic data
jest.mock("@/lib/hooks/useUserProfile", () => ({
  useUserProfile: jest.fn(() => ({
    profile: {
      id: "123",
      first_name: "John",
      last_name: "Doe",
      display_name: "JohnD",
      email: "john@example.com",
    },
    loading: false,
    error: null,
  })),
}));

jest.mock("@/lib/hooks/useUserRoles", () => ({
  useUserRoles: jest.fn(() => ({
    isAdmin: true,
    isInstructor: false,
    isOrganizer: false,
    isDancer: true,
    roles: ["DANCER", "ADMIN"],
    loading: false,
  })),
}));

describe("Navigation Integration", () => {
  it("renders complete sidebar with all nav elements", () => {
    render(<AppSidebar user={mockUser} />);

    // Header
    expect(screen.getByText("Dance Practice")).toBeInTheDocument();

    // User info - email comes from mockUser (test@example.com)
    expect(screen.getByText("JohnD")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    // Navigation links
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Matches")).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();

    // Footer
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });

  it("shows all links with correct href attributes", () => {
    render(<AppSidebar user={mockUser} />);

    const profileLink = screen.getByRole("link", { name: /profile/i });
    expect(profileLink).toHaveAttribute("href", "/profile");

    const scheduleLink = screen.getByRole("link", { name: /schedule/i });
    expect(scheduleLink).toHaveAttribute("href", "/schedule");

    const matchesLink = screen.getByRole("link", { name: /matches/i });
    expect(matchesLink).toHaveAttribute("href", "/matches");

    const sessionsLink = screen.getByRole("link", { name: /sessions/i });
    expect(sessionsLink).toHaveAttribute("href", "/sessions");

    const adminLink = screen.getByRole("link", { name: /admin/i });
    expect(adminLink).toHaveAttribute("href", "/admin");

    const settingsLink = screen.getByRole("link", { name: /settings/i });
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });
});
