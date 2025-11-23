/**
 * Tests for PersonalInfoForm component
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonalInfoForm } from "../PersonalInfoForm";
import { updateProfile } from "@/lib/profiles/api";
import { toast } from "sonner";
import type { UserProfile } from "@/lib/profiles/types";

// Mock dependencies
jest.mock("@/lib/profiles/api");
jest.mock("sonner");

const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};
(toast as any).success = mockToast.success;
(toast as any).error = mockToast.error;

const setupUser = () => {
  const user = userEvent.setup();

  return {
    ...user,
    click: async (...args: Parameters<typeof user.click>) => {
      await act(async () => {
        await user.click(...args);
      });
    },
    type: async (...args: Parameters<typeof user.type>) => {
      await act(async () => {
        await user.type(...args);
      });
    },
    clear: async (...args: Parameters<typeof user.clear>) => {
      await act(async () => {
        await user.clear(...args);
      });
    },
  };
};

describe("PersonalInfoForm", () => {
  const mockProfile: UserProfile = {
    id: "profile-123",
    authUserId: "auth-456",
    firstName: "John",
    lastName: "Doe",
    displayName: "Johnny",
    email: "john@example.com",
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

  it("should render with fields always editable", () => {
    render(<PersonalInfoForm profile={mockProfile} />);

    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    
    // Fields should be enabled (editable)
    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
    expect(firstNameInput).not.toBeDisabled();
    expect(firstNameInput.value).toBe("John");
  });

  it("should display profile data correctly", () => {
    render(<PersonalInfoForm profile={mockProfile} />);

    expect(screen.getByLabelText(/first name/i)).toHaveValue("John");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
    expect(screen.getByLabelText(/display name/i)).toHaveValue("Johnny");
    expect(screen.getByLabelText(/email/i)).toHaveValue("john@example.com");
    expect(screen.getByLabelText(/birth date/i)).toHaveValue("1990-01-01");
  });

  it("should have save button always visible", () => {
    render(<PersonalInfoForm profile={mockProfile} />);

    // Save button should always be visible
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    // No Edit or Cancel buttons should exist
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();

    // Fields should be enabled (except email)
    expect(screen.getByLabelText(/first name/i)).toBeEnabled();
    expect(screen.getByLabelText(/last name/i)).toBeEnabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
  });

  it("should update profile successfully", async () => {
    const user = setupUser();
    mockUpdateProfile.mockResolvedValueOnce({
      ...mockProfile,
      firstName: "Jane",
      lastName: "Smith",
    });

    render(<PersonalInfoForm profile={mockProfile} />);

    // Change values (no need to click Edit - fields are already editable)
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Jane");
    await user.clear(lastNameInput);
    await user.type(lastNameInput, "Smith");

    // Submit form
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).not.toBeDisabled(); // Should be enabled when form is dirty
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith("profile-123", {
        first_name: "Jane",
        last_name: "Smith",
        display_name: "Johnny",
        birth_date: "1990-01-01",
      });
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Personal information updated successfully");
    });

    // Save button should still be visible (always editable)
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("should show validation errors for required fields", async () => {
    const user = setupUser();
    render(<PersonalInfoForm profile={mockProfile} />);

    // Clear required fields (fields are already editable)
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);

    // Try to submit
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
    });

    // Should not call updateProfile
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("should have save button disabled when form is not dirty", () => {
    render(<PersonalInfoForm profile={mockProfile} />);

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it("should handle empty display name (converts to null)", async () => {
    const user = setupUser();
    mockUpdateProfile.mockResolvedValueOnce(mockProfile);

    render(<PersonalInfoForm profile={mockProfile} />);

    const displayNameInput = screen.getByLabelText(/display name/i);
    await user.clear(displayNameInput);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith("profile-123", {
        first_name: "John",
        last_name: "Doe",
        display_name: null,
        birth_date: "1990-01-01",
      });
    });
  });

  it("should show error message when update fails", async () => {
    const user = setupUser();
    const errorMessage = "Network error";
    mockUpdateProfile.mockRejectedValueOnce(new Error(errorMessage));

    render(<PersonalInfoForm profile={mockProfile} />);
    
    // Make form dirty
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.type(firstNameInput, "x");
    
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    // Save button should still be visible (always editable)
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });


  it("should show helper text for display name", () => {
    render(<PersonalInfoForm profile={mockProfile} />);

    expect(screen.getByText(/leave blank to use your first name/i)).toBeInTheDocument();
  });

  it("should show helper text for email", () => {
    render(<PersonalInfoForm profile={mockProfile} />);

    expect(screen.getByText(/email cannot be changed here/i)).toBeInTheDocument();
  });
});

