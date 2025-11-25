import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/test-utils";
import AppError from "../error";

// Suppress console.error in tests
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

const mockReset = jest.fn();

describe("App Error Page", () => {
  const mockError = new Error("App error message") as Error & { digest?: string };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders error message", () => {
    render(<AppError error={mockError} reset={mockReset} />);

    expect(screen.getByText("Application Error")).toBeInTheDocument();
    expect(screen.getByText("App error message")).toBeInTheDocument();
  });

  it("renders default message when error has no message", () => {
    const errorWithoutMessage = new Error() as Error & { digest?: string };
    render(<AppError error={errorWithoutMessage} reset={mockReset} />);

    expect(screen.getByText(/An error occurred in the application/i)).toBeInTheDocument();
  });

  it("calls reset when Try again button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppError error={mockError} reset={mockReset} />);

    const resetButton = screen.getByText(/Try again/i);
    await user.click(resetButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("renders profile link", () => {
    render(<AppError error={mockError} reset={mockReset} />);

    const profileLink = screen.getByText(/Go to profile/i).closest("a");
    expect(profileLink).toHaveAttribute("href", "/profile");
  });
});
