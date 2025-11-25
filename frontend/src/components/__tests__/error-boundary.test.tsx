import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "../error-boundary";

// Component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  const originalError = console.error;

  beforeEach(() => {
    // Suppress error output in tests
    console.error = jest.fn();
    // Reset React error boundary state
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error = originalError;
    jest.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("catches errors and displays error UI", () => {
    // Suppress React error boundary warning
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    // Error message should be displayed (either custom or default)
    expect(
      screen.getByText(/Test error|An unexpected error occurred/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Try again/i)).toBeInTheDocument();

    spy.mockRestore();
  });

  it("displays custom error message when error has message", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    function CustomError() {
      throw new Error("Custom error message");
    }

    render(
      <ErrorBoundary>
        <CustomError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("calls onError callback when error occurs", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );

    spy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const customFallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();

    spy.mockRestore();
  });

  it("has reset button that can be clicked", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    const resetButton = screen.getByText(/Try again/i);
    expect(resetButton).toBeInTheDocument();

    // Verify button is clickable
    await user.click(resetButton);

    // After clicking reset, the error boundary state is cleared
    // (The component would need to be remounted to test full reset behavior)

    spy.mockRestore();
  });
});
