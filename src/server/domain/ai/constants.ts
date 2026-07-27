export const AI_OPERATION_TYPES = [
  "DESTINATION_RECOMMENDATION",
  "ITINERARY_GENERATION",
  "ITINERARY_DAY_REGENERATION",
  "ITINERARY_ITEM_REPLACEMENT",
  "ITINERARY_EDIT",
  "ITINERARY_REPAIR",
  "OUTPUT_SCHEMA_REPAIR",
] as const;

export type AiOperationTypeName = (typeof AI_OPERATION_TYPES)[number];

export const AI_LIMITS = {
  recommendationCandidatesMin: 5,
  recommendationCandidatesMax: 40,
  recommendationResultMin: 3,
  recommendationResultMax: 5,
  instructionMax: 1000,
  notesMax: 500,
  additionalPreferencesMax: 1000,
  previewTtlHours: 24,
  recommendationTtlHours: 24,
  maxItemsRelaxed: 5,
  maxItemsBalanced: 7,
  maxItemsFast: 9,
  minItemsPerDay: 2,
  repairMaxAttempts: 1,
  dailyOperationDefault: 40,
  idempotencyKeyMax: 128,
} as const;

export const AI_DEFAULTS = {
  provider: "gemini",
  model: "gemini-2.5-flash",
  timeoutMs: 300_000,
  recommendationTimeoutMs: 45_000,
  editTimeoutMs: 45_000,
  generationTimeoutMs: 300_000,
  maxRetries: 2, // initial attempt + up to 2 retries = 3 total
  maxOutputTokens: 8192,
  recommendationMaxOutputTokens: 2048,
  editMaxOutputTokens: 4096,
  temperature: 0.4,
  editTemperature: 0.2,
  enableRepair: true,
} as const;

/** Approximate USD per 1M tokens — operational estimate only. */
export const AI_MODEL_PRICING_USD_PER_MILLION: Record<
  string,
  { input: number; output: number }
> = {
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-3.5-flash": { input: 0.15, output: 0.6 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "nvidia/nemotron-3-ultra-550b-a55b:free": { input: 0, output: 0 },
  "nvidia/nemotron-3-nano-30b-a3b:free": { input: 0, output: 0 },
  fake: { input: 0, output: 0 },
};
