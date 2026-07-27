/** Local time-of-day as minutes from midnight (0–1439). */

export function minutesToHhMm(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function hhMmToMinutes(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new Error(`Invalid time value: ${value}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isValidMinutes(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 1439;
}

export type ScheduleInterval = {
  id: string;
  startMinutes: number;
  endMinutes: number;
};

export function detectScheduleOverlaps(
  items: ScheduleInterval[],
): Array<{ a: string; b: string }> {
  const overlaps: Array<{ a: string; b: string }> = [];
  const sorted = [...items].sort((x, y) => x.startMinutes - y.startMinutes);

  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const left = sorted[i]!;
      const right = sorted[j]!;
      if (right.startMinutes >= left.endMinutes) break;
      if (left.startMinutes < right.endMinutes && right.startMinutes < left.endMinutes) {
        overlaps.push({ a: left.id, b: right.id });
      }
    }
  }

  return overlaps;
}
