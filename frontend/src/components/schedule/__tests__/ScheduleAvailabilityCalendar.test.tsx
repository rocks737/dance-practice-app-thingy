import { describe, it, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { ScheduleAvailabilityCalendar } from "../ScheduleAvailabilityCalendar";
import { AvailabilityWindow } from "@/lib/schedule/types";

// Mock the dynamically imported calendar
jest.mock("react-big-calendar", () => ({
  Calendar: () => <div data-testid="mock-calendar">Calendar</div>,
}));

jest.mock("react-big-calendar/lib/addons/dragAndDrop", () => ({
  __esModule: true,
  default: (Component: any) => Component,
}));

describe("ScheduleAvailabilityCalendar", () => {
  const mockOnCreate = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render instructions", () => {
    render(
      <ScheduleAvailabilityCalendar
        windows={[]}
        onCreateWindow={mockOnCreate}
        onUpdateWindow={mockOnUpdate}
        onDeleteWindow={mockOnDelete}
      />
    );

    expect(screen.getByText(/Click and drag/i)).toBeInTheDocument();
    expect(screen.getByText(/Right-click blocks/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag blocks/i)).toBeInTheDocument();
  });

  it("should display recurring and one-time legends", () => {
    render(
      <ScheduleAvailabilityCalendar
        windows={[]}
        onCreateWindow={mockOnCreate}
        onUpdateWindow={mockOnUpdate}
        onDeleteWindow={mockOnDelete}
      />
    );

    expect(screen.getByText("Recurring (every week)")).toBeInTheDocument();
    expect(screen.getAllByText(/One-time only/i).length).toBeGreaterThan(0);
  });

  it("should display navigation controls", () => {
    render(
      <ScheduleAvailabilityCalendar
        windows={[]}
        onCreateWindow={mockOnCreate}
        onUpdateWindow={mockOnUpdate}
        onDeleteWindow={mockOnDelete}
      />
    );

    expect(screen.getByRole("button", { name: /Previous Week/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next Week/i })).toBeInTheDocument();
  });

  it("should display correct week range text", () => {
    render(
      <ScheduleAvailabilityCalendar
        windows={[]}
        onCreateWindow={mockOnCreate}
        onUpdateWindow={mockOnUpdate}
        onDeleteWindow={mockOnDelete}
      />
    );

    // Should show a date range
    expect(screen.getByText(/\w+ \d+ - \w+ \d+, \d{4}/)).toBeInTheDocument();
  });

  it("should show instructions for right-click", () => {
    render(
      <ScheduleAvailabilityCalendar
        windows={[]}
        onCreateWindow={mockOnCreate}
        onUpdateWindow={mockOnUpdate}
        onDeleteWindow={mockOnDelete}
      />
    );

    expect(screen.getByText(/Right-click blocks/i)).toBeInTheDocument();
    expect(screen.getByText(/to make them one-time only or delete them/i)).toBeInTheDocument();
  });
});
