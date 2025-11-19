/**
 * Tests for ProfileEditor component
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileEditor } from "../ProfileEditor";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/profiles/types";

// Mock dependencies
jest.mock("@/lib/hooks/useUserProfile");
jest.mock("../PersonalInfoForm", () => ({
  PersonalInfoForm: () => <div data-testid="personal-info-form">Personal Info Form</div>,
}));

const mockUseUserProfile = useUserProfile as jest.MockedFunction<typeof useUserProfile>;

describe("ProfileEditor", () => {
  const mockUser: User = {
    id: "auth-123",
    email: "test@example.com",
    aud: "authenticated",
    role: "authenticated",
    created_at: "2024-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
  };

  const mockProfile: UserProfile = {
    id: "profile-123",
    authUserId: "auth-123",
    firstName: "John",
    lastName: "Doe",
    displayName: "Johnny",
    email: "test@example.com",
    bio: null,
    danceGoals: null,
    birthDate: "1990-01-01",
    profileVisible: true,
    primaryRole: 0,
    wsdcLevel: 2,
    competitivenessLevel: 3,
    accountStatus: 0,
    homeLocationId: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state", () => {
    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: true,
      error: null,
    });

    render(<ProfileEditor user={mockUser} />);

    // Check for Loader2 icon (animated spinner)
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should render error state", () => {
    const errorMessage = "Failed to load profile";
    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: new Error(errorMessage),
    });

    render(<ProfileEditor user={mockUser} />);

    expect(screen.getByText(/error loading profile/i)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("should render 'profile not found' when profile is null", () => {
    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
    });

    render(<ProfileEditor user={mockUser} />);

    expect(screen.getByText(/profile not found/i)).toBeInTheDocument();
  });

  it("should render profile editor with tabs when profile loads", () => {
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<ProfileEditor user={mockUser} />);

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText(/manage your personal information/i)).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByRole("tab", { name: /personal/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /dance/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /biography/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /security/i })).toBeInTheDocument();
  });

  it("should show PersonalInfoForm in personal tab by default", () => {
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<ProfileEditor user={mockUser} />);

    expect(screen.getByTestId("personal-info-form")).toBeInTheDocument();
  });

  it("should switch tabs when clicked", async () => {
    const user = userEvent.setup();
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<ProfileEditor user={mockUser} />);

    // Default tab should be Personal
    expect(screen.getByTestId("personal-info-form")).toBeInTheDocument();

    // Click Dance tab
    await user.click(screen.getByRole("tab", { name: /dance/i }));
    expect(screen.getByText(/dance preferences/i)).toBeInTheDocument();
    expect(screen.queryByTestId("personal-info-form")).not.toBeInTheDocument();

    // Click Biography tab
    await user.click(screen.getByRole("tab", { name: /biography/i }));
    expect(screen.getByText(/biography/i)).toBeInTheDocument();

    // Click Settings tab
    await user.click(screen.getByRole("tab", { name: /settings/i }));
    expect(screen.getByText(/profile settings/i)).toBeInTheDocument();

    // Click Security tab
    await user.click(screen.getByRole("tab", { name: /security/i }));
    expect(screen.getByText(/security/i)).toBeInTheDocument();
  });

  it("should show placeholder for unimplemented tabs", async () => {
    const user = userEvent.setup();
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<ProfileEditor user={mockUser} />);

    await user.click(screen.getByRole("tab", { name: /dance/i }));
    expect(screen.getByText(/🚧 coming soon/i)).toBeInTheDocument();
  });

  it("should call useUserProfile with correct user ID", () => {
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<ProfileEditor user={mockUser} />);

    expect(mockUseUserProfile).toHaveBeenCalledWith("auth-123");
  });

  it("should display user icon in header", () => {
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<ProfileEditor user={mockUser} />);

    // Check for UserCircle icon (it renders as an svg)
    const icon = screen.getByRole("heading", { name: /profile/i }).parentElement?.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});

