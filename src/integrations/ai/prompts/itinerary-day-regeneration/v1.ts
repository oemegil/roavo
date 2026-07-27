import type { PromptDefinition } from "@/integrations/ai/types";
import {
  dayRegenerationResultSchema,
  type DayRegenerationResult,
} from "@/integrations/ai/output-schemas";
import { AI_DEFAULTS } from "@/server/domain/ai/constants";

export type DayRegenPromptInput = {
  instruction?: string;
  preserveManualItems: boolean;
  trip: unknown;
  day: unknown;
  neighbors: unknown;
};

export const itineraryDayRegenerationPromptV1: PromptDefinition<
  DayRegenPromptInput,
  DayRegenerationResult
> = {
  key: "itinerary-day-regeneration",
  version: "v1",
  operation: "ITINERARY_DAY_REGENERATION",
  description: "Regenerate a single trip day",
  defaults: {
    temperature: AI_DEFAULTS.editTemperature,
    maxOutputTokens: AI_DEFAULTS.editMaxOutputTokens,
    timeoutMs: AI_DEFAULTS.editTimeoutMs,
  },
  outputSchema: dayRegenerationResultSchema,
  schemaHint: `{
  "summary": string,
  "warnings": string[],
  "dayId": existing day id,
  "theme": string|null,
  "notes": string|null,
  "preservedItemIds": string[],
  "replacementItems": item[]
}`,
  buildSystemPrompt: () => `You regenerate one day of a Roavo itinerary for Turkish-speaking travelers.
Return ONLY JSON. Use the provided dayId. Preserve manual item IDs when preserveManualItems is true.
Write summary, theme, notes, and item titles/descriptions in Turkish.
Every replacement item must include realistic startTime and endTime (HH:mm) in chronological order with no overlaps.
Avoid duplicating neighbor-day activities. No invented IDs, bookings, maps, or live data claims.`,
  buildUserPrompt: (input) =>
    [
      "INSTRUCTION_BEGIN",
      input.instruction ?? "Regenerate this day with a fresh but coherent plan.",
      "INSTRUCTION_END",
      `preserveManualItems=${input.preserveManualItems}`,
      "TRIP_BEGIN",
      JSON.stringify(input.trip),
      "TRIP_END",
      "DAY_BEGIN",
      JSON.stringify(input.day),
      "DAY_END",
      "NEIGHBORS_BEGIN",
      JSON.stringify(input.neighbors),
      "NEIGHBORS_END",
    ].join("\n"),
};
