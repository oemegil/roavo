# Provider abstraction

`AiProvider` lives in `src/integrations/ai/types.ts`.

Implementations:

- `GeminiAiProvider` — Google Generative Language REST API
- `FakeAiProvider` — deterministic CI/dev responses

Factory: `getAiProvider()` reads `AI_PROVIDER` / keys and caches the client.
