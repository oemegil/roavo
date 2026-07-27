# ADR-008: Structured output and repair

## Status

Accepted

## Context

Models may wrap JSON in fences or emit schema-invalid payloads.

## Decision

1. Prefer provider JSON MIME mode when available
2. Extract JSON safely (raw / fence / first object)
3. Validate with Zod
4. Optionally run one repair call (`OUTPUT_SCHEMA_REPAIR`)
5. Domain-validate before persistence

## Consequences

- Invalid AI output never becomes Trip rows
- Repair is bounded (max one attempt)
- Full prompts/outputs are not logged
