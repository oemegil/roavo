"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const WEEKDAYS_SHORT_TR = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"] as const;

const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTurkishDate(value: string): string | null {
  const date = parseLocalDateOnly(value);
  if (!date) return null;
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
}

function todayDateOnly() {
  return toDateOnly(new Date());
}

function buildMonthCells(viewYear: number, viewMonth: number) {
  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: Array<{ dateOnly: string; day: number } | null> = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateOnly: toDateOnly(new Date(viewYear, viewMonth, day)),
      day,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Compact date-range trigger: opens a popover calendar on click.
 * First day = start, second day = end (then closes).
 */
export function TurkishDateRangeField(props: {
  id?: string;
  label?: string;
  startDate: string;
  endDate: string;
  minDate?: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}) {
  const minDate = props.minDate ?? todayDateOnly();
  const label = props.label ?? "Tarih aralığı";
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<string | null>(null);

  const initialView = parseLocalDateOnly(props.startDate) ?? new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const effectiveStart = draftStart ?? props.startDate;
  const effectiveEnd = draftStart ? "" : props.endDate;

  const hasFullRange = Boolean(props.startDate && props.endDate);
  const summary = hasFullRange
    ? `${formatTurkishDate(props.startDate)} – ${formatTurkishDate(props.endDate)}`
    : props.startDate
      ? `${formatTurkishDate(props.startDate)} – bitiş seç`
      : "Tarih aralığı seç";

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setDraftStart(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setDraftStart(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openCalendar() {
    const anchor = parseLocalDateOnly(props.startDate) ?? new Date();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
    setDraftStart(null);
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function handleDayClick(dateOnly: string) {
    if (dateOnly < minDate) return;

    const startingFresh =
      !draftStart &&
      ((props.startDate && props.endDate) || !effectiveStart || Boolean(effectiveEnd));

    if (startingFresh) {
      setDraftStart(dateOnly);
      props.onChange({ startDate: dateOnly, endDate: "" });
      return;
    }

    if (dateOnly < effectiveStart) {
      setDraftStart(dateOnly);
      props.onChange({ startDate: dateOnly, endDate: "" });
      return;
    }

    setDraftStart(null);
    props.onChange({ startDate: effectiveStart, endDate: dateOnly });
    setOpen(false);
  }

  function isInRange(dateOnly: string) {
    if (!effectiveStart) return false;
    if (!effectiveEnd) return dateOnly === effectiveStart;
    return dateOnly >= effectiveStart && dateOnly <= effectiveEnd;
  }

  function isEdge(dateOnly: string) {
    return dateOnly === effectiveStart || dateOnly === effectiveEnd;
  }

  const selectingEnd = Boolean(draftStart || (props.startDate && !props.endDate));

  return (
    <div ref={rootRef} className="relative space-y-2" lang="tr">
      <Label htmlFor={props.id}>{label}</Label>
      <button
        id={props.id}
        type="button"
        onClick={() => (open ? setOpen(false) : openCalendar())}
        className={cn(
          "border-input bg-background flex h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors",
          "hover:bg-muted/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          !hasFullRange && "text-muted-foreground",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarDays className="text-muted-foreground size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{summary}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Tarih aralığı seç"
          className="border-border bg-background absolute z-50 mt-2 w-[min(100%,20rem)] rounded-xl border p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-md"
              onClick={() => shiftMonth(-1)}
              aria-label="Önceki ay"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-medium">
              {MONTHS_TR[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-md"
              onClick={() => shiftMonth(1)}
              aria-label="Sonraki ay"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS_SHORT_TR.map((day) => (
              <div
                key={day}
                className="text-muted-foreground py-1.5 text-[11px] font-medium"
              >
                {day}
              </div>
            ))}
            {cells.map((cell, index) => {
              if (!cell) return <div key={`empty-${index}`} className="h-9" />;
              const disabled = cell.dateOnly < minDate;
              const selected = isInRange(cell.dateOnly);
              const edge = isEdge(cell.dateOnly);
              return (
                <button
                  key={cell.dateOnly}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(cell.dateOnly)}
                  className={cn(
                    "h-9 rounded-md text-sm transition-colors",
                    disabled && "text-muted-foreground/35 cursor-not-allowed",
                    !disabled && !selected && "hover:bg-muted",
                    selected && !edge && "bg-primary/12",
                    edge && "bg-primary text-primary-foreground font-medium",
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <p className="text-muted-foreground mt-2 text-xs">
            {selectingEnd
              ? "Bitiş tarihini seç"
              : "Başlangıç, sonra bitiş tarihini seç"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
