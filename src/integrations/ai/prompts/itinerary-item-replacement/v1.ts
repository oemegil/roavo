import type { PromptDefinition } from "@/integrations/ai/types";
import {
  itemReplacementResultSchema,
  type ItemReplacementResult,
} from "@/integrations/ai/output-schemas";
import { AI_DEFAULTS } from "@/server/domain/ai/constants";

export type ItemReplacePromptInput = {
  instruction: string;
  trip: unknown;
  day: unknown;
  item: unknown;
  neighbors: unknown;
};

export const itineraryItemReplacementPromptV1: PromptDefinition<
  ItemReplacePromptInput,
  ItemReplacementResult
> = {
  key: "itinerary-item-replacement",
  version: "v1",
  operation: "ITINERARY_ITEM_REPLACEMENT",
  description: "Replace a single itinerary item",
  defaults: {
    temperature: AI_DEFAULTS.editTemperature,
    maxOutputTokens: 1536,
    timeoutMs: AI_DEFAULTS.editTimeoutMs,
  },
  outputSchema: itemReplacementResultSchema,
  schemaHint: `{
  "summary": string,
  "warnings": string[],
  "itemId": existing item id,
  "replacement": item fields,
  "reason": string
}`,
  buildSystemPrompt: () => `You replace one itinerary item for Roavo.
Return ONLY JSON. Keep the same itemId. Do not modify unrelated items.
No bookings, maps, live hours, or invented exact addresses.`,
  buildUserPrompt: (input) =>
    [
      "INSTRUCTION_BEGIN",
      input.instruction,
      "INSTRUCTION_END",
      "TRIP_BEGIN",
      JSON.stringify(input.trip),
      "TRIP_END",
      "DAY_BEGIN",
      JSON.stringify(input.day),
      "DAY_END",
      "ITEM_BEGIN",
      JSON.stringify(input.item),
      "ITEM_END",
      "NEIGHBORS_BEGIN",
      JSON.stringify(input.neighbors),
      "NEIGHBORS_END",
    ].join("\n"),
};
