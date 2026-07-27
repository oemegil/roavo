import { TRIP_LIMITS } from "./constants";
import { eachDateInclusive, inclusiveDayCount } from "./date-only";

export type GeneratedTripDay = {
  date: Date;
  title: string;
  position: number;
};

export function generateDaysForRange(start: Date, end: Date): GeneratedTripDay[] {
  const duration = inclusiveDayCount(start, end);
  if (duration < 1) {
    throw new Error("endDate must not be before startDate.");
  }
  if (duration > TRIP_LIMITS.maxDurationDays) {
    throw new Error(`Trip duration cannot exceed ${TRIP_LIMITS.maxDurationDays} days.`);
  }

  return eachDateInclusive(start, end).map((date, index) => ({
    date,
    title: `Gün ${index + 1}`,
    position: index,
  }));
}

export type ExistingDay = {
  id: string;
  date: Date;
  itemCount: number;
};

export type DateRangeSyncPlan =
  | { type: "noop" }
  | {
      type: "apply";
      add: GeneratedTripDay[];
      removeEmptyDayIds: string[];
      shiftUpdates: Array<{ dayId: string; date: Date; title: string; position: number }>;
      keepDayIds: string[];
      blockedDayIds: string[];
    };

/**
 * Plan day synchronization for a new date range.
 * Days with items outside the new range block the update.
 */
export function planDateRangeSync(input: {
  existingDays: ExistingDay[];
  newStart: Date;
  newEnd: Date;
}): DateRangeSyncPlan {
  const targetDates = eachDateInclusive(input.newStart, input.newEnd);
  const targetKeys = targetDates.map((d) => d.toISOString());
  const targetKeySet = new Set(targetKeys);

  const sortedExisting = [...input.existingDays].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const sameLength = sortedExisting.length === targetDates.length;
  const allShifted =
    sameLength &&
    sortedExisting.length > 0 &&
    sortedExisting.every(
      (day, index) => day.date.toISOString() !== targetDates[index]!.toISOString(),
    ) &&
    inclusiveDayCount(sortedExisting[0]!.date, sortedExisting.at(-1)!.date) ===
      targetDates.length;

  if (allShifted) {
    return {
      type: "apply",
      add: [],
      removeEmptyDayIds: [],
      shiftUpdates: sortedExisting.map((day, index) => ({
        dayId: day.id,
        date: targetDates[index]!,
        title: `Gün ${index + 1}`,
        position: index,
      })),
      keepDayIds: sortedExisting.map((d) => d.id),
      blockedDayIds: [],
    };
  }

  const existingByKey = new Map(
    sortedExisting.map((day) => [day.date.toISOString(), day]),
  );

  const keepDayIds: string[] = [];
  const removeEmptyDayIds: string[] = [];
  const blockedDayIds: string[] = [];

  for (const day of sortedExisting) {
    const key = day.date.toISOString();
    if (targetKeySet.has(key)) {
      keepDayIds.push(day.id);
    } else if (day.itemCount > 0) {
      blockedDayIds.push(day.id);
    } else {
      removeEmptyDayIds.push(day.id);
    }
  }

  if (blockedDayIds.length > 0) {
    return {
      type: "apply",
      add: [],
      removeEmptyDayIds: [],
      shiftUpdates: [],
      keepDayIds,
      blockedDayIds,
    };
  }

  const add: GeneratedTripDay[] = [];
  targetDates.forEach((date, index) => {
    if (!existingByKey.has(date.toISOString())) {
      add.push({
        date,
        title: `Gün ${index + 1}`,
        position: index,
      });
    }
  });

  const shiftUpdates = keepDayIds.map((dayId) => {
    const day = sortedExisting.find((d) => d.id === dayId)!;
    const position = targetKeys.indexOf(day.date.toISOString());
    return {
      dayId,
      date: day.date,
      title: `Gün ${position + 1}`,
      position,
    };
  });

  if (add.length === 0 && removeEmptyDayIds.length === 0) {
    const positionsChanged = shiftUpdates.some((update, index) => {
      const day = sortedExisting.find((d) => d.id === update.dayId);
      return day && index !== update.position;
    });
    if (!positionsChanged) {
      return { type: "noop" };
    }
  }

  return {
    type: "apply",
    add,
    removeEmptyDayIds,
    shiftUpdates,
    keepDayIds,
    blockedDayIds: [],
  };
}
