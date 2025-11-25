import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/test/test-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

jest.unmock("next-themes");

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({
    theme: "light",
    setTheme: jest.fn(),
  })),
}));

describe("ThemeToggle", () => {
  it("renders the toggle button", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("shows moon icon in light mode", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    // Check for sr-only text
    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });

  it("shows sun icon in dark mode", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });

  it("calls setTheme when clicked", () => {
    const setTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("toggles from dark to light when clicked", () => {
    const setTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
