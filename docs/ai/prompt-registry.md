# Prompt registry

Prompts live under `src/integrations/ai/prompts/<feature>/v1.ts`.

Each definition includes key, version, operation, builders, Zod output schema, and defaults.

Never place prompts in Route Handlers or React components.
