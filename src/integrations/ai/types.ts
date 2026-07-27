import type { z } from "zod";

import type { AiOperationTypeName } from "@/server/domain/ai/constants";

export type AiTokenUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

export type AiGenerateStructuredRequest = {
  operation: AiOperationTypeName;
  systemPrompt: string;
  userPrompt: string;
  /** JSON Schema-ish description for the model (human-readable). */
  schemaHint: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
};

export type AiGenerateStructuredResult = {
  text: string;
  usage: AiTokenUsage;
  finishReason: string | null;
  providerRequestId: string | null;
  latencyMs: number;
  model: string;
  provider: string;
};

export type AiProviderCapabilities = {
  structuredOutput: boolean;
  jsonMode: boolean;
  systemPrompt: boolean;
  temperature: boolean;
  tokenUsageReporting: boolean;
  cancellation: boolean;
};

export interface AiProvider {
  readonly name: string;
  generateStructured(
    request: AiGenerateStructuredRequest,
  ): Promise<AiGenerateStructuredResult>;
  healthCheck(): Promise<{ ok: boolean; provider: string }>;
  getCapabilities(): AiProviderCapabilities;
}

export type PromptDefinition<TInput, TOutput> = {
  key: string;
  version: string;
  operation: AiOperationTypeName;
  description: string;
  buildSystemPrompt: (input: TInput) => string;
  buildUserPrompt: (input: TInput) => string;
  outputSchema: z.ZodType<TOutput>;
  schemaHint: string;
  defaults: {
    temperature: number;
    maxOutputTokens: number;
    timeoutMs: number;
  };
};
