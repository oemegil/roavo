import { describe, expect, it } from "vitest";

import {
  formatDateOnly,
  inclusiveDayCount,
  parseDateOnly,
} from "@/server/domain/trips/date-only";
import { generateDaysForRange, planDateRangeSync } from "@/server/domain/trips/day-planner";
import { detectScheduleOverlaps, hhMmToMinutes, minutesToHhMm } from "@/server/domain/trips/time-of-day";
import { majorToMinor, minorToMajor } from "@/server/domain/trips/money";
import { assertPermutation, insertAtPositions } from "@/server/domain/trips/ordering";

describe("date-only", () => {
  it("parses and formats without timezone shift", () => {
    const date = parseDateOnly("2026-07-26");
    expect(formatDateOnly(date)).toBe("2026-07-26");
    expect(date.getUTCHours()).toBe(0);
  });

  it("counts inclusive days", () => {
    expect(
      inclusiveDayCount(parseDateOnly("2026-07-01"), parseDateOnly("2026-07-03")),
    ).toBe(3);
  });
});

describe("day planner", () => {
  it("generates one day per date", () => {
    const days = generateDaysForRange(
      parseDateOnly("2026-08-01"),
      parseDateOnly("2026-08-03"),
    );
    expect(days).toHaveLength(3);
    expect(days[0]?.title).toBe("Gün 1");
    expect(days[2]?.position).toBe(2);
  });

  it("blocks shrinking when days have items", () => {
    const plan = planDateRangeSync({
      existingDays: [
        { id: "d1", date: parseDateOnly("2026-08-01"), itemCount: 0 },
        { id: "d2", date: parseDateOnly("2026-08-02"), itemCount: 2 },
      ],
      newStart: parseDateOnly("2026-08-01"),
      newEnd: parseDateOnly("2026-08-01"),
    });
    expect(plan.type).toBe("apply");
    if (plan.type === "apply") {
      expect(plan.blockedDayIds).toContain("d2");
    }
  });
});

describe("time and money", () => {
  it("converts HH:mm", () => {
    expect(hhMmToMinutes("09:30")).toBe(570);
    expect(minutesToHhMm(570)).toBe("09:30");
  });

  it("detects overlaps", () => {
    const overlaps = detectScheduleOverlaps([
      { id: "a", startMinutes: 600, endMinutes: 700 },
      { id: "b", startMinutes: 650, endMinutes: 750 },
    ]);
    expect(overlaps).toHaveLength(1);
  });

  it("uses minor units", () => {
    expect(majorToMinor(12.5, "USD")).toBe(1250);
    expect(minorToMajor(1250, "USD")).toBe(12.5);
    expect(majorToMinor(1000, "JPY")).toBe(1000);
  });
});

describe("ordering", () => {
  it("validates permutations", () => {
    expect(() => assertPermutation(["a", "b"], ["a", "b"])).not.toThrow();
    expect(() => assertPermutation(["a"], ["a", "b"])).toThrow();
  });

  it("inserts at index", () => {
    expect(insertAtPositions(["a", "b", "c"], "b", 0)).toEqual(["b", "a", "c"]);
  });
});
