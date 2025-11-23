import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render as renderWithUtils } from "@/test/test-utils";
import ErrorComponent from "../error";

// Suppress console.error in tests
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

// Mock Next.js router
const mockReset = jest.fn();

describe("Root Error Page", () => {
  const mockError = new Error("Test error message") as Error & { digest?: string };
  mockError.digest = "test-digest";

  it("renders error message", () => {
    renderWithUtils(<ErrorComponent error={mockError} reset={mockReset} />);

    expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders default message when error has no message", () => {
    const errorWithoutMessage = new Error() as Error & { digest?: string };
    renderWithUtils(<ErrorComponent error={errorWithoutMessage} reset={mockReset} />);

    expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
  });

  it("calls reset when Try again button is clicked", async () => {
    const user = userEvent.setup();
    renderWithUtils(<ErrorComponent error={mockError} reset={mockReset} />);

    const resetButton = screen.getByText(/Try again/i);
    await user.click(resetButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("renders home link", () => {
    renderWithUtils(<ErrorComponent error={mockError} reset={mockReset} />);

    const homeLink = screen.getByText(/Go home/i).closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("shows error stack in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const errorWithStack = new Error("Test error");
    errorWithStack.stack = "Error: Test error\n    at test.js:1:1";

    renderWithUtils(<ErrorComponent error={errorWithStack} reset={mockReset} />);

    expect(screen.getByText(/Error details/i)).toBeInTheDocument();
    expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("does not show error stack in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const errorWithStack = new Error("Test error");
    errorWithStack.stack = "Error: Test error\n    at test.js:1:1";

    renderWithUtils(<ErrorComponent error={errorWithStack} reset={mockReset} />);

    expect(screen.queryByText(/Error details/i)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

