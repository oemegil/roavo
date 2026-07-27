# AI integration boundary

Provider-agnostic AI access will live here.

Application code must depend on an `AIProvider` interface, never on a concrete SDK.

Supported providers (later): Gemini, OpenAI, Anthropic Claude, Ollama.

Do not install provider SDKs in this bootstrap phase.
