# AI architecture

## Principles

- AI is not the domain — provider output is untrusted
- Provider SDKs stay in `src/integrations/ai`
- Prompt registry is versioned
- Structured Zod validation + one bounded repair
- Previews require explicit apply
- Manual itinerary items are protected by default
- No maps / live Places / booking / visa engines

## Selected provider

| Setting | Value |
|---------|-------|
| Provider | Google Gemini (REST `generateContent`) |
| Default model | `gemini-2.0-flash` |
| Dev fallback | `fake` provider when no API key in development / always in tests |
| Execution | Synchronous request/response with `AiOperation` persistence |

## Layers

1. Route handlers — auth, validation, rate limits
2. Application services — domain orchestration
3. `executeStructuredAiOperation` — operation record, provider call, parse, validate, repair, usage
4. Prompt definitions — system/user builders + schemas
5. Provider implementations — Gemini / Fake

## Prompt versions

| Key | Version |
|-----|---------|
| destination-recommendation | v1 |
| itinerary-generation | v1 |
| itinerary-edit | v1 |
| itinerary-day-regeneration | v1 |
| itinerary-item-replacement | v1 |

## Mobile-future

HTTP JSON contracts under `/api/v1/ai/*` and trip AI routes are presentation-independent. Cookie session auth remains web-specific; mobile tokens are deferred.
