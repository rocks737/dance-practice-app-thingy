import { datetimeLocalToIso, dateToDatetimeLocal } from "@/lib/datetime";

describe("datetime helpers", () => {
  it("converts datetime-local strings to ISO using local timezone", () => {
    const expected = new Date(2025, 0, 15, 10, 30, 0, 0).toISOString();
    expect(datetimeLocalToIso("2025-01-15T10:30")).toBe(expected);
  });

  it("handles midnight values correctly", () => {
    const expected = new Date(2025, 6, 1, 0, 0, 0, 0).toISOString();
    expect(datetimeLocalToIso("2025-07-01T00:00")).toBe(expected);
  });

  it("throws on invalid input", () => {
    expect(() => datetimeLocalToIso("invalid")).toThrow("Invalid datetime-local value");
  });

  it("formats dates for datetime-local inputs", () => {
    const date = new Date(2025, 3, 5, 9, 45, 0, 0);
    expect(dateToDatetimeLocal(date)).toBe("2025-04-05T09:45");
  });
});

