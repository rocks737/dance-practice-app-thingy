/**
 * Tests for SignupProgress component
 */

import { describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { SignupProgress } from "../signup-progress";

describe("SignupProgress", () => {
  describe("Step Labels", () => {
    it("should display all step labels", () => {
      render(<SignupProgress currentStep={1} totalSteps={4} />);

      expect(screen.getByText("Create Account")).toBeInTheDocument();
      expect(screen.getByText("Personal Info")).toBeInTheDocument();
      expect(screen.getByText("Dance Profile")).toBeInTheDocument();
      expect(screen.getByText("Availability")).toBeInTheDocument();
    });
  });

  describe("Step Numbers", () => {
    it("should display step numbers for uncompleted steps", () => {
      render(<SignupProgress currentStep={1} totalSteps={4} />);

      // Step 1 is current, so it shows the number
      expect(screen.getByText("1")).toBeInTheDocument();
      // Steps 2, 3, 4 are future, so they show numbers
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should show checkmark for completed steps", () => {
      render(<SignupProgress currentStep={3} totalSteps={4} />);

      // Steps 1 and 2 are completed, should have checkmarks (Check icon)
      // Current step (3) should show number
      expect(screen.getByText("3")).toBeInTheDocument();
      // Step 4 is future, should show number
      expect(screen.getByText("4")).toBeInTheDocument();

      // Check that numbers 1 and 2 are NOT displayed (replaced by checkmarks)
      expect(screen.queryByText("1")).not.toBeInTheDocument();
      expect(screen.queryByText("2")).not.toBeInTheDocument();
    });
  });

  describe("Current Step Highlighting", () => {
    it("should highlight the current step", () => {
      const { container } = render(<SignupProgress currentStep={2} totalSteps={4} />);

      // The current step (2) should have primary styling
      const stepCircles = container.querySelectorAll(".rounded-full");
      expect(stepCircles.length).toBe(4);

      // First step (completed) should have bg-primary
      expect(stepCircles[0]).toHaveClass("bg-primary");

      // Second step (current) should have bg-primary
      expect(stepCircles[1]).toHaveClass("bg-primary");

      // Third and fourth steps (future) should have bg-background
      expect(stepCircles[2]).toHaveClass("bg-background");
      expect(stepCircles[3]).toHaveClass("bg-background");
    });
  });

  describe("Progress Indicator States", () => {
    it("should show all steps as uncompleted on first step", () => {
      render(<SignupProgress currentStep={1} totalSteps={4} />);

      // All step numbers should be visible (none completed yet)
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should show first step as completed when on second step", () => {
      render(<SignupProgress currentStep={2} totalSteps={4} />);

      // Step 1 should be completed (no number visible for step 1)
      expect(screen.queryByText("1")).not.toBeInTheDocument();

      // Steps 2, 3, 4 should show numbers
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should show all steps completed on final step", () => {
      render(<SignupProgress currentStep={4} totalSteps={4} />);

      // Steps 1, 2, 3 should be completed (no numbers visible)
      expect(screen.queryByText("1")).not.toBeInTheDocument();
      expect(screen.queryByText("2")).not.toBeInTheDocument();
      expect(screen.queryByText("3")).not.toBeInTheDocument();

      // Step 4 is current, should show number
      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });

  describe("Connector Lines", () => {
    it("should render connector lines between steps", () => {
      const { container } = render(<SignupProgress currentStep={1} totalSteps={4} />);

      // There should be 3 connector lines (between 4 steps)
      const connectorLines = container.querySelectorAll(".h-0\\.5.mx-4");
      expect(connectorLines.length).toBe(3);
    });

    it("should highlight completed connector lines", () => {
      const { container } = render(<SignupProgress currentStep={3} totalSteps={4} />);

      const connectorLines = container.querySelectorAll(".h-0\\.5.mx-4");

      // First two connectors (before current step) should have bg-primary
      expect(connectorLines[0]).toHaveClass("bg-primary");
      expect(connectorLines[1]).toHaveClass("bg-primary");

      // Third connector (after current step) should have bg-gray-300
      expect(connectorLines[2]).toHaveClass("bg-gray-300");
    });
  });

  describe("Accessibility", () => {
    it("should have appropriate structure for screen readers", () => {
      const { container } = render(<SignupProgress currentStep={2} totalSteps={4} />);

      // Main container should exist
      expect(container.firstChild).toHaveClass("w-full");

      // All labels should be readable
      expect(screen.getByText("Create Account")).toBeVisible();
      expect(screen.getByText("Personal Info")).toBeVisible();
      expect(screen.getByText("Dance Profile")).toBeVisible();
      expect(screen.getByText("Availability")).toBeVisible();
    });
  });

  describe("Edge Cases", () => {
    it("should handle step 1 correctly", () => {
      render(<SignupProgress currentStep={1} totalSteps={4} />);

      // No checkmarks should be visible
      const checkmarks = screen.queryAllByRole("img", { hidden: true });
      // All step numbers should be visible
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("should handle the last step correctly", () => {
      render(<SignupProgress currentStep={4} totalSteps={4} />);

      // Step 4 should show number (current)
      expect(screen.getByText("4")).toBeInTheDocument();

      // Steps 1-3 should be completed (checkmarks, no numbers)
      expect(screen.queryByText("1")).not.toBeInTheDocument();
      expect(screen.queryByText("2")).not.toBeInTheDocument();
      expect(screen.queryByText("3")).not.toBeInTheDocument();
    });
  });
});
