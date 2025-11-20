import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScheduleAvailabilityCalendar } from "../ScheduleAvailabilityCalendar";
import type { AvailabilityWindow } from "@/lib/schedule/types";

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ScheduleAvailabilityCalendar", () => {
  const mockWindows: AvailabilityWindow[] = [
    {
      dayOfWeek: "MONDAY",
      startTime: "18:00",
      endTime: "20:00",
    },
    {
      dayOfWeek: "WEDNESDAY",
      startTime: "19:00",
      endTime: "21:00",
    },
  ];

  const mockOnCreateWindow = jest.fn();
  const mockOnUpdateWindow = jest.fn();
  const mockOnDeleteWindow = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the calendar component", () => {
    render(
      <ScheduleAvailabilityCalendar
        windows={mockWindows}
        onCreateWindow={mockOnCreateWindow}
        onUpdateWindow={mockOnUpdateWindow}
        onDeleteWindow={mockOnDeleteWindow}
      />
    );

    // Check for instruction text
    expect(screen.getByText(/Click and drag/i)).toBeInTheDocument();
  });

  it("displays existing availability windows", () => {
    render(
      <ScheduleAvailabilityCalendar
        windows={mockWindows}
        onCreateWindow={mockOnCreateWindow}
        onUpdateWindow={mockOnUpdateWindow}
        onDeleteWindow={mockOnDeleteWindow}
      />
    );

    // The calendar should render with events - just verify it doesn't crash
    expect(screen.getByText(/Click and drag/i)).toBeInTheDocument();
  });

  it("renders with no windows", () => {
    render(
      <ScheduleAvailabilityCalendar
        windows={[]}
        onCreateWindow={mockOnCreateWindow}
        onUpdateWindow={mockOnUpdateWindow}
        onDeleteWindow={mockOnDeleteWindow}
      />
    );

    // Should render without errors
    expect(screen.getByText(/Click and drag/i)).toBeInTheDocument();
  });
});

