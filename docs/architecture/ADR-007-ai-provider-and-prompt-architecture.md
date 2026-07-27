# ADR-007: AI provider and prompt architecture

## Status

Accepted

## Context

Roavo needs replaceable AI for destination recommendations and itineraries without coupling the domain to a vendor SDK.

## Decision

- Use a provider interface (`generateStructured`, `healthCheck`, `getCapabilities`)
- Implement Gemini via HTTPS fetch (server-only) and a deterministic Fake provider for CI
- Centralize prompts under `src/integrations/ai/prompts` with explicit versions
- Select provider/model via env (`AI_PROVIDER`, `AI_MODEL`, `GEMINI_API_KEY`)

## Consequences

- Tests never require live keys
- Adding OpenAI later means a new provider module only
- Prompt changes require a new version string
